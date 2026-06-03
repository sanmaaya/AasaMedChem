import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { quotations, quotationItems, users, products, notifications } from '@/lib/schema';
import { toBaseQuantity, getPricePerOrderedUnit } from '@/lib/units';
import { eq, and, desc } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

// GET /api/quotations - List quotations based on user role scope
export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || '';

  try {
    const conditions: ReturnType<typeof eq>[] = [];
    if (user.role === 'seller') {
      conditions.push(eq(quotations.sellerId, user.id));
    } else if (user.role === 'buyer') {
      conditions.push(eq(quotations.buyerId, user.id));
    }
    if (statusFilter) {
      conditions.push(eq(quotations.status, statusFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.quotations.findMany({
      where: whereClause,
      with: {
        seller: { columns: { id: true, name: true, email: true } },
        buyer: { columns: { id: true, name: true, email: true } },
        items: {
          with: {
            product: { columns: { id: true, name: true, sku: true } }
          }
        }
      },
      orderBy: [desc(quotations.createdAt)]
    });

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/quotations error:", err);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/quotations - Submit a new quotation (Seller or Buyer)
// NOTE: neon-http driver does NOT support transactions. All inserts are sequential.
export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== 'seller' && session.user.role !== 'buyer')) {
    return NextResponse.json({ error: 'Unauthorized. Role not authorized to submit orders.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { buyerId, items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Quotation must include at least one item.' }, { status: 400 });
    }

    const isBuyer = session.user.role === 'buyer';
    const finalBuyerId: string = isBuyer ? session.user.id : buyerId;

    if (!finalBuyerId) {
      return NextResponse.json({ error: 'A buyer account must be specified.' }, { status: 400 });
    }

    // Verify buyer exists
    const [buyerUser] = await db.select()
      .from(users)
      .where(and(eq(users.id, finalBuyerId), eq(users.role, 'buyer')))
      .limit(1);

    if (!buyerUser) {
      return NextResponse.json({ error: 'Invalid buyer account selected.' }, { status: 400 });
    }

    // Group items by sellerId
    const groupedBySeller: Record<string, Array<{
      product: typeof products.$inferSelect;
      orderedUnit: string;
      orderedQuantity: Decimal;
    }>> = {};

    for (const cartItem of items) {
      const { productId, orderedUnit, orderedQuantity } = cartItem;
      const qty = new Decimal(orderedQuantity || 0);

      if (qty.lte(0)) {
        throw new Error('Quantity must be greater than zero.');
      }

      const [prod] = await db.select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.isActive, true)))
        .limit(1);

      if (!prod) {
        throw new Error(`Product not found or is inactive: ${productId}`);
      }

      let itemSellerId = prod.sellerId;
      if (!itemSellerId) {
        const [defaultSeller] = await db.select()
          .from(users)
          .where(eq(users.role, 'seller'))
          .limit(1);
        if (!defaultSeller) {
          throw new Error('No active seller representative found to link with this listing.');
        }
        itemSellerId = defaultSeller.id;
      }

      if (!isBuyer && session.user.id !== itemSellerId) {
        throw new Error(`Unauthorized. You do not have authority to sell product: ${prod.name}`);
      }

      if (!groupedBySeller[itemSellerId]) {
        groupedBySeller[itemSellerId] = [];
      }

      groupedBySeller[itemSellerId].push({ product: prod, orderedUnit, orderedQuantity: qty });
    }

    // Sequential inserts — neon-http does not support transactions
    const createdQuotes: (typeof quotations.$inferSelect)[] = [];

    for (const sellerId of Object.keys(groupedBySeller)) {
      const sellerItems = groupedBySeller[sellerId];
      let grandTotal = new Decimal(0);

      const itemsToInsert: {
        productId: string;
        orderedUnit: string;
        orderedQuantity: string;
        baseQuantity: string;
        unitPriceAtOrder: string;
        lineTotal: string;
      }[] = [];

      for (const { product, orderedUnit, orderedQuantity } of sellerItems) {
        const baseQty = toBaseQuantity(orderedQuantity.toNumber(), orderedUnit);
        const unitPrice = getPricePerOrderedUnit(parseFloat(product.basePricePerUnit), orderedUnit);
        const lineTotal = orderedQuantity.mul(unitPrice);
        grandTotal = grandTotal.add(lineTotal);

        itemsToInsert.push({
          productId: product.id,
          orderedUnit,
          orderedQuantity: orderedQuantity.toString(),
          baseQuantity: baseQty.toString(),
          unitPriceAtOrder: unitPrice.toString(),
          lineTotal: lineTotal.toString(),
        });
      }

      // Insert quotation header
      const [insertedQuote] = await db.insert(quotations).values({
        sellerId,
        buyerId: finalBuyerId,
        status: 'pending',
        totalAmount: grandTotal.toString(),
        notes: notes || null,
      }).returning();

      // Insert quotation line items
      await db.insert(quotationItems).values(
        itemsToInsert.map(item => ({ ...item, quotationId: insertedQuote.id }))
      );

      createdQuotes.push(insertedQuote);
    }

    // Notify ALL admin users — non-fatal if this fails
    try {
      const adminUsers = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      if (adminUsers.length > 0) {
        const quoteId = createdQuotes[0]?.id ?? '';
        await db.insert(notifications).values(
          adminUsers.map(admin => ({
            userId: admin.id,
            title: '🛒 New Quotation Pending Review',
            message: `Quotation #${quoteId.substring(0, 8).toUpperCase()} submitted by ${buyerUser.name} is awaiting your approval.`,
            isRead: false,
          }))
        );
      }
    } catch (notifyErr) {
      console.warn('Failed to notify admins of new quotation:', notifyErr);
    }

    return NextResponse.json(
      createdQuotes.length === 1 ? createdQuotes[0] : createdQuotes,
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/quotations error:", err);
    return NextResponse.json({ error: err.message || 'Failed to submit quotation' }, { status: 400 });
  }
}
