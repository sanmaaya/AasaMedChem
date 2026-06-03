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

// POST /api/quotations - Submit a new quotation (Seller Only)
export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized. Seller role required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { buyerId, items, notes } = body;

    // Validate inputs
    if (!buyerId) {
      return NextResponse.json({ error: 'A buyer account must be selected.' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Quotation must include at least one item.' }, { status: 400 });
    }

    // Verify buyer exists and indeed has role = 'buyer'
    const [buyerUser] = await db.select()
      .from(users)
      .where(and(eq(users.id, buyerId), eq(users.role, 'buyer')))
      .limit(1);

    if (!buyerUser) {
      return NextResponse.json({ error: 'Invalid buyer selected.' }, { status: 400 });
    }

    // Run within a transaction to guarantee atomic execution
    const newQuotation = await db.transaction(async (tx) => {
      let grandTotal = new Decimal(0);
      const itemsToInsert = [];

      for (const cartItem of items) {
        const { productId, orderedUnit, orderedQuantity } = cartItem;
        const qty = new Decimal(orderedQuantity || 0);

        if (qty.lte(0)) {
          throw new Error('Quantity must be greater than zero.');
        }

        // Fetch product to retrieve latest price and check status
        const [prod] = await tx.select()
          .from(products)
          .where(and(eq(products.id, productId), eq(products.isActive, true)))
          .limit(1);

        if (!prod) {
          throw new Error(`Product not found or is inactive: ${productId}`);
        }

        // Calculate converted variables
        const baseQty = toBaseQuantity(qty.toNumber(), orderedUnit);
        const unitPrice = getPricePerOrderedUnit(parseFloat(prod.basePricePerUnit), orderedUnit);
        const lineTotal = qty.mul(unitPrice);

        grandTotal = grandTotal.add(lineTotal);

        itemsToInsert.push({
          productId,
          orderedUnit,
          orderedQuantity: qty.toString(),
          baseQuantity: baseQty.toString(),
          unitPriceAtOrder: unitPrice.toString(),
          lineTotal: lineTotal.toString(),
        });
      }

      // 1. Create the Quotation record
      const [insertedQuote] = await tx.insert(quotations).values({
        sellerId: session.user.id,
        buyerId,
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

      return insertedQuote;
    });

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (err) {
    console.error("POST /api/quotations transaction error:", err);
    return NextResponse.json({ error: err.message || 'Failed to submit quotation' }, { status: 400 });
  }
}
