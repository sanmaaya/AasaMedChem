import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { db } from '@/lib/db.js';
import { products } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';

// PUT /api/products/[id] - Update an existing product (Admin Only)
export async function PUT(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'seller')) {
    return NextResponse.json({ error: 'Unauthorized. Admin or Seller role required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, sku, category, description, baseUnit, basePricePerUnit, stockQuantity, isActive } = body;

    // Check if product exists
    const [existingProduct] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Auth check: Sellers can only edit their own products
    if (session.user.role === 'seller' && existingProduct.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. You can only edit your own listings.' }, { status: 403 });
    }

    // Basic validation
    if (!name || !baseUnit || !basePricePerUnit || stockQuantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['g', 'mL', 'unit'].includes(baseUnit)) {
      return NextResponse.json({ error: "Invalid base unit" }, { status: 400 });
    }

    const price = parseFloat(basePricePerUnit);
    const stock = parseFloat(stockQuantity);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'Price and quantity must be non-negative' }, { status: 400 });
    }

    const [updatedProduct] = await db.update(products)
      .set({
        name,
        sku: sku || null,
        category: category || null,
        description: description || null,
        baseUnit,
        basePricePerUnit: price.toString(),
        stockQuantity: stock.toString(),
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(updatedProduct);
  } catch (err) {
    console.error(`PUT /api/products/${id} error:`, err);
    if (err.message && err.message.includes('unique constraint')) {
      return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Soft delete / Deactivate a product (Admin Only)
export async function DELETE(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'seller')) {
    return NextResponse.json({ error: 'Unauthorized. Admin or Seller role required.' }, { status: 403 });
  }

  try {
    const [existingProduct] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Auth check: Sellers can only deactivate their own products
    if (session.user.role === 'seller' && existingProduct.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. You can only deactivate your own listings.' }, { status: 403 });
    }

    // Set isActive to false instead of hard deleting
    const [deactivatedProduct] = await db.update(products)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({ message: 'Product deactivated successfully', product: deactivatedProduct });
  } catch (err) {
    console.error(`DELETE /api/products/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }
}
