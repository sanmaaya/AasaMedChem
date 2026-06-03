import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { quotations, quotationItems, products, stockHistoryLogs, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { logAction } from '@/lib/audit';
import { sendEmail } from '@/lib/email';

// PATCH /api/quotations/[id]/status - Approve/Reject or update Order Status
export async function PATCH(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { role, id: currentUserId } = session.user;

  try {
    const body = await request.json();
    const { status, orderStatus } = body;

    if (!status && !orderStatus) {
      return NextResponse.json({ error: 'Missing status or orderStatus fields.' }, { status: 400 });
    }

    // Load quotation details with buyer and seller info
    const [quote] = await db.select()
      .from(quotations)
      .where(eq(quotations.id, id))
      .limit(1);

    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    const [buyerUser] = await db.select().from(users).where(eq(users.id, quote.buyerId)).limit(1);
    const [sellerUser] = await db.select().from(users).where(eq(users.id, quote.sellerId)).limit(1);

    if (!buyerUser || !sellerUser) {
      return NextResponse.json({ error: 'Associated buyer or seller accounts not found.' }, { status: 400 });
    }

    // 1. Authorization & Status updates (Approve / Reject)
    if (status) {
      if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized. Admin role required to resolve quotations.' }, { status: 403 });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: "Invalid status. Must be 'approved' or 'rejected'" }, { status: 400 });
      }

      if (quote.status !== 'pending') {
        return NextResponse.json({ error: `Quotation has already been resolved as: ${quote.status}` }, { status: 400 });
      }

      const updatedQuotation = await db.transaction(async (tx) => {
        // If approving, decrement stock and log to stock history
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

            const newStock = currentStock.sub(baseQtyNeeded);

            // Decrement in database
            await tx.update(products)
              .set({ 
                stockQuantity: newStock.toString(), 
                updatedAt: new Date() 
              })
              .where(eq(products.id, item.productId));

            // Log stock history change
            await tx.insert(stockHistoryLogs).values({
              productId: item.productId,
              userId: currentUserId,
              oldStock: currentStock.toString(),
              newStock: newStock.toString(),
              changeReason: 'QUOTATION_ALLOCATE',
            });
          }
        }

        // Update main quotation status
        const [updated] = await tx.update(quotations)
          .set({ 
            status, 
            orderStatus: status === 'approved' ? 'packed' : 'pending', // approved orders start at packed status
            updatedAt: new Date() 
          })
          .where(eq(quotations.id, id))
          .returning();

        return updated;
      });

      // Send emails & logs outside transaction
      await logAction(currentUserId, `QUOTATION_${status.toUpperCase()}`, { quotationId: id });

      // Notify Buyer
      await sendEmail({
        to: buyerUser.email,
        subject: `Quotation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: `Hello ${buyerUser.name},\n\nYour quotation request #${id.substring(0, 8).toUpperCase()} has been ${status} by the Administrator.\n\nThank you,\nAasaMedChem Team`,
        userId: buyerUser.id
      });

      // Notify Seller
      await sendEmail({
        to: sellerUser.email,
        subject: `Quotation ${status.charAt(0).toUpperCase() + status.slice(1)} Notification`,
        body: `Hello ${sellerUser.name},\n\nQuotation #${id.substring(0, 8).toUpperCase()} drafted for ${buyerUser.name} has been ${status} by the Administrator.\n\nThank you,\nAasaMedChem Team`,
        userId: sellerUser.id
      });

      return NextResponse.json(updatedQuotation);
    }

    // 2. Order Status updates (Packed -> Dispatched -> Delivered)
    if (orderStatus) {
      if (role !== 'admin' && role !== 'seller') {
        return NextResponse.json({ error: 'Unauthorized. Admin or Seller role required to track order status.' }, { status: 403 });
      }

      if (!['pending', 'packed', 'dispatched', 'delivered'].includes(orderStatus)) {
        return NextResponse.json({ error: "Invalid orderStatus. Must be 'pending', 'packed', 'dispatched', or 'delivered'" }, { status: 400 });
      }

      if (quote.status !== 'approved') {
        return NextResponse.json({ error: 'Order status can only be tracked for approved quotations.' }, { status: 400 });
      }

      const [updated] = await db.update(quotations)
        .set({ 
          orderStatus, 
          updatedAt: new Date() 
        })
        .where(eq(quotations.id, id))
        .returning();

      await logAction(currentUserId, 'QUOTATION_ORDER_STATUS_CHANGE', { quotationId: id, orderStatus });

      // Notify Buyer of shipping updates
      await sendEmail({
        to: buyerUser.email,
        subject: `Order Status Update: ${orderStatus.toUpperCase()}`,
        body: `Hello ${buyerUser.name},\n\nYour order #${id.substring(0, 8).toUpperCase()} status has been updated to: ${orderStatus.toUpperCase()}.\n\nThank you,\nAasaMedChem Team`,
        userId: buyerUser.id
      });

      // Notify Seller
      await sendEmail({
        to: sellerUser.email,
        subject: `Order Status Update: ${orderStatus.toUpperCase()}`,
        body: `Hello ${sellerUser.name},\n\nOrder #${id.substring(0, 8).toUpperCase()} status has been updated to: ${orderStatus.toUpperCase()}.\n\nThank you,\nAasaMedChem Team`,
        userId: sellerUser.id
      });

      return NextResponse.json(updated);
    }

  } catch (err) {
    console.error(`PATCH /api/quotations/${id}/status error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update status.' }, { status: 400 });
  }
}
