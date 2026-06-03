import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { db } from '@/lib/db.js';
import { quotations, quotationItems, products } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

// PATCH /api/quotations/[id]/status - Approve or reject quotation (Admin Only)
export async function PATCH(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be 'approved' or 'rejected'" }, { status: 400 });
    }

    const updatedQuotation = await db.transaction(async (tx) => {
      // 1. Fetch current quotation state
      const [quote] = await tx.select()
        .from(quotations)
        .where(eq(quotations.id, id))
        .limit(1);

      if (!quote) {
        throw new Error('Quotation not found.');
      }

      if (quote.status !== 'pending') {
        throw new Error(`Quotation has already been resolved as: ${quote.status}`);
      }

      // 2. If approving, check stock levels and update inventory
      if (status === 'approved') {
        const items = await tx.select()
          .from(quotationItems)
          .where(eq(quotationItems.quotationId, id));

        for (const item of items) {
          const [productRecord] = await tx.select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!productRecord) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          const currentStock = new Decimal(productRecord.stockQuantity);
          const baseQtyNeeded = new Decimal(item.baseQuantity);

          if (currentStock.lt(baseQtyNeeded)) {
            throw new Error(
              `Insufficient stock for '${productRecord.name}'. Available: ${currentStock.toString()} ${productRecord.baseUnit}, Required: ${baseQtyNeeded.toString()} ${productRecord.baseUnit}`
            );
          }

          // Decrement stock in DB
          const newStock = currentStock.sub(baseQtyNeeded);
          await tx.update(products)
            .set({ 
              stockQuantity: newStock.toString(), 
              updatedAt: new Date() 
            })
            .where(eq(products.id, item.productId));
        }
      }

      // 3. Update status in DB
      const [updated] = await tx.update(quotations)
        .set({ 
          status, 
          updatedAt: new Date() 
        })
        .where(eq(quotations.id, id))
        .returning();

      return updated;
    });

    return NextResponse.json(updatedQuotation);
  } catch (err) {
    console.error(`PATCH /api/quotations/${id}/status error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update quotation status' }, { status: 400 });
  }
}
