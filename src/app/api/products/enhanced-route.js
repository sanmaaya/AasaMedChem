import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import { products, categories, stockHistoryLogs, auditLogs } from '@/lib/schema';
import { eq, and, or, like, desc } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { auth } from '@/auth';

/**
 * GET /api/products - Fetch all products with filtering, search, and pagination
 * Query params: search, category, inStock, page, limit, sortBy
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const inStock = searchParams.get('inStock') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // name, price, stock, createdAt
    const offset = (page - 1) * limit;

    // Build where clause
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }

    if (category) {
      whereConditions.push(eq(products.categoryId, category));
    }

    if (inStock) {
      whereConditions.push(and(products.stock > 0));
    }

    // Build order clause
    let orderClause = desc(products.createdAt);
    switch (sortBy) {
      case 'name':
        orderClause = products.name;
        break;
      case 'price':
        orderClause = desc(products.price);
        break;
      case 'stock':
        orderClause = desc(products.stock);
        break;
    }

    // Fetch products with pagination
    const allProducts = await db
      .select()
      .from(products)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: products.id })
      .from(products)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalCount = countResult.length > 0 ? parseInt(countResult[0].count) : 0;

    return NextResponse.json({
      data: allProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products - Create a new product
 * Body: { name, description, sku, categoryId, baseUnit, price, stock, lowStockThreshold, image }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      name,
      description,
      sku,
      categoryId,
      baseUnit,
      price,
      stock,
      lowStockThreshold,
      image,
    } = await request.json();

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (!sku?.trim()) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Insert product
    const result = await db
      .insert(products)
      .values({
        name: name.trim(),
        description: description?.trim() || '',
        sku: sku.trim(),
        categoryId,
        baseUnit,
        price: new Decimal(price).toString(),
        stock: new Decimal(stock).toNumber(),
        lowStockThreshold: new Decimal(lowStockThreshold || 10).toNumber(),
        image: image || null,
        createdBy: session.user.id,
      })
      .returning();

    // Log audit event
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'create_product',
      entityType: 'product',
      entityId: result[0].id,
      changes: `Created product: ${name}`,
    });

    // Log stock history
    await db.insert(stockHistoryLogs).values({
      productId: result[0].id,
      oldStock: 0,
      newStock: new Decimal(stock).toNumber(),
      changeReason: 'MANUAL_EDIT',
      changedBy: session.user.id,
    });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products - Bulk update products (e.g., stock adjustment)
 * Body: { updates: [{ id, stock, price }] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { updates } = await request.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid updates format' },
        { status: 400 }
      );
    }

    const results = [];

    for (const update of updates) {
      const { id, stock, price } = update;

      // Fetch current product
      const current = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (current.length === 0) {
        continue; // Skip not found
      }

      const product = current[0];
      const oldStock = product.stock;

      // Update product
      await db
        .update(products)
        .set({
          stock: stock !== undefined ? new Decimal(stock).toNumber() : product.stock,
          price: price !== undefined ? new Decimal(price).toString() : product.price,
        })
        .where(eq(products.id, id));

      // Log stock history if stock changed
      if (stock !== undefined && stock !== oldStock) {
        await db.insert(stockHistoryLogs).values({
          productId: id,
          oldStock,
          newStock: new Decimal(stock).toNumber(),
          changeReason: 'MANUAL_EDIT',
          changedBy: session.user.id,
        });
      }

      // Log audit event
      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: 'update_product',
        entityType: 'product',
        entityId: id,
        changes: `Updated: ${stock !== undefined ? `stock=${stock}` : ''} ${price !== undefined ? `price=${price}` : ''}`.trim(),
      });

      results.push({ id, success: true });
    }

    return NextResponse.json({ updated: results.length, results });
  } catch (error) {
    console.error('PATCH /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to update products' },
      { status: 500 }
    );
  }
}
