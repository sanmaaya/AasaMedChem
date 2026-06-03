import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { db } from '@/lib/db.js';
import { quotations, quotationItems, users, products } from '@/lib/schema.js';
import { toBaseQuantity, getPricePerOrderedUnit } from '@/lib/units.js';
import { eq, and, desc } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

// GET /api/quotations - List quotations based on user role scope
export async function GET(request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || '';

  try {
    // We will build the query depending on the role
    let conditions = [];
    if (user.role === 'seller') {
      conditions.push(eq(quotations.sellerId, user.id));
    } else if (user.role === 'buyer') {
      conditions.push(eq(quotations.buyerId, user.id));
    }

    if (statusFilter) {
      conditions.push(eq(quotations.status, statusFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Use Relational Query interface for clean joins
    const list = await db.query.quotations.findMany({
      where: whereClause,
      with: {
        seller: {
          columns: { id: true, name: true, email: true }
        },
        buyer: {
          columns: { id: true, name: true, email: true }
        },
        items: {
          with: {
            product: {
              columns: { id: true, name: true, sku: true }
            }
          }
        }
      },
      orderBy: [desc(quotations.createdAt)]
    });

    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/quotations error:", err);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/quotations - Submit a new quotation (Seller or Buyer)
export async function POST(request) {
  const session = await auth();

  if (!session || (session.user.role !== 'seller' && session.user.role !== 'buyer')) {
    return NextResponse.json({ error: 'Unauthorized. Role not authorized to submit orders.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { buyerId, items, notes } = body;

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Quotation must include at least one item.' }, { status: 400 });
    }

    const isBuyer = session.user.role === 'buyer';
    const finalBuyerId = isBuyer ? session.user.id : buyerId;

    if (!finalBuyerId) {
      return NextResponse.json({ error: 'A buyer account must be specified.' }, { status: 400 });
    }

    // Verify buyer exists and indeed has role = 'buyer'
    const [buyerUser] = await db.select()
      .from(users)
      .where(and(eq(users.id, finalBuyerId), eq(users.role, 'buyer')))
      .limit(1);

    if (!buyerUser) {
      return NextResponse.json({ error: 'Invalid buyer account selected.' }, { status: 400 });
    }

    // Group items by sellerId
    const groupedBySeller = {}; // sellerId -> Array of items

    for (const cartItem of items) {
      const { productId, orderedUnit, orderedQuantity } = cartItem;
      const qty = new Decimal(orderedQuantity || 0);

      if (qty.lte(0)) {
        throw new Error('Quantity must be greater than zero.');
      }

      // Fetch product to retrieve latest price and check status
      const [prod] = await db.select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.isActive, true)))
        .limit(1);

      if (!prod) {
        throw new Error(`Product not found or is inactive: ${productId}`);
      }

      // Determine seller ID for this product
      let itemSellerId = prod.sellerId;
      if (!itemSellerId) {
        // Fallback to the default seeded seller
        const [defaultSeller] = await db.select()
          .from(users)
          .where(eq(users.role, 'seller'))
          .limit(1);
        if (!defaultSeller) {
          throw new Error('No active seller representative found to link with this listing.');
        }
        itemSellerId = defaultSeller.id;
      }

      // If logged in user is a seller, they can only sell products listed under their own ID
      if (!isBuyer && session.user.id !== itemSellerId) {
        throw new Error(`Unauthorized. You do not have authority to sell product: ${prod.name}`);
      }

      if (!groupedBySeller[itemSellerId]) {
        groupedBySeller[itemSellerId] = [];
      }

      groupedBySeller[itemSellerId].push({
        product: prod,
        orderedUnit,
        orderedQuantity: qty
      });
    }

    // Create quotations inside a transaction
    const createdQuotes = [];

    await db.transaction(async (tx) => {
      for (const sellerId of Object.keys(groupedBySeller)) {
        const sellerItems = groupedBySeller[sellerId];
        let grandTotal = new Decimal(0);
        const itemsToInsert = [];

        for (const element of sellerItems) {
          const { product, orderedUnit, orderedQuantity } = element;
          
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

        // 1. Create the Quotation record
        const [insertedQuote] = await tx.insert(quotations).values({
          sellerId,
          buyerId: finalBuyerId,
          status: 'pending',
          totalAmount: grandTotal.toString(),
          notes: notes || null,
        }).returning();

        // 2. Create the Quotation Items records
        const finalItems = itemsToInsert.map(item => ({
          ...item,
          quotationId: insertedQuote.id
        }));

        await tx.insert(quotationItems).values(finalItems);
        createdQuotes.push(insertedQuote);
      }
    });

    return NextResponse.json(createdQuotes.length === 1 ? createdQuotes[0] : createdQuotes, { status: 201 });
  } catch (err) {
    console.error("POST /api/quotations transaction error:", err);
    return NextResponse.json({ error: err.message || 'Failed to submit quotation' }, { status: 400 });
  }
}
