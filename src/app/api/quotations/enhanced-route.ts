import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import {
  quotations,
  quotationItems,
  users,
  products,
  auditLogs,
} from '@/lib/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { auth } from '@/auth';

/**
 * GET /api/quotations - Fetch all quotations with filtering
 * Query params: status, sellerId, buyerId, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    // Build where clause based on role and permissions
    let whereConditions = [];

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected', 'expired'].includes(status)) {
      whereConditions.push(eq(quotations.status, status));
    }

    // Role-based filtering
    if (session.user.role === 'seller') {
      whereConditions.push(eq(quotations.sellerId, session.user.id));
    } else if (session.user.role === 'buyer') {
      whereConditions.push(eq(quotations.buyerId, session.user.id));
    }
    // admin can see all

    // Fetch quotations
    const allQuotations = await db
      .select()
      .from(quotations)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(quotations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: quotations.id })
      .from(quotations)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = countResult.length > 0 ? parseInt(countResult[0].count) : 0;

    return NextResponse.json({
      data: allQuotations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/quotations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotations - Create a new quotation
 * Body: { buyerId, items: [{ productId, orderedQuantity, orderedUnit, unitPrice }], notes }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { buyerId, items, notes } = await request.json();

    if (!buyerId) {
      return NextResponse.json({ error: 'Buyer ID is required' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Verify buyer exists
    const buyer = await db
      .select()
      .from(users)
      .where(eq(users.id, buyerId))
      .limit(1);

    if (buyer.length === 0) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Calculate total
    let totalAmount = new Decimal(0);
    for (const item of items) {
      const lineTotal = new Decimal(item.unitPrice || 0).times(
        item.orderedQuantity || 0
      );
      totalAmount = totalAmount.plus(lineTotal);
    }

    // Create quotation
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + (parseInt(process.env.QUOTATION_EXPIRY_DAYS || '30'))
    );

    const quotation = await db
      .insert(quotations)
      .values({
        sellerId: session.user.id,
        buyerId,
        status: 'pending',
        totalAmount: totalAmount.toString(),
        notes: notes || '',
        expiresAt,
      })
      .returning();

    // Add quotation items
    const quotationItemsData = items.map(item => ({
      quotationId: quotation[0].id,
      productId: item.productId,
      orderedQuantity: new Decimal(item.orderedQuantity).toNumber(),
      orderedUnit: item.orderedUnit || 'unit',
      unitPrice: new Decimal(item.unitPrice).toString(),
      lineTotal: new Decimal(item.unitPrice).times(item.orderedQuantity).toString(),
    }));

    await db.insert(quotationItems).values(quotationItemsData);

    // Log audit event
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'create_quotation',
      entityType: 'quotation',
      entityId: quotation[0].id,
      changes: `Created quotation with ${items.length} items, total: ${totalAmount}`,
    });

    return NextResponse.json(
      { id: quotation[0].id, ...quotation[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quotations/:id/status - Update quotation status
 * Body: { status: 'approved' | 'rejected', notes }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const quotationId = pathParts[pathParts.length - 2]; // Extract from /api/quotations/:id/status
    const action = pathParts[pathParts.length - 1]; // 'status'

    if (action !== 'status') {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const { status, notes } = await request.json();

    if (!['approved', 'rejected', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch quotation
    const quotation = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    if (quotation.length === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Verify permissions (buyer can approve/reject, admin can do anything)
    if (
      session.user.role !== 'admin' &&
      session.user.id !== quotation[0].buyerId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status
    const updated = await db
      .update(quotations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    // Log audit event
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: `quotation_${status}`,
      entityType: 'quotation',
      entityId: quotationId,
      changes: notes || `Status changed to ${status}`,
    });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PATCH /api/quotations/:id/status error:', error);
    return NextResponse.json(
      { error: 'Failed to update quotation' },
      { status: 500 }
    );
  }
}
