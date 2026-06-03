import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { db } from '@/lib/db.js';
import { products } from '@/lib/schema.js';
import { eq, and, ilike, or } from 'drizzle-orm';

// GET /api/products - List and search products
export async function GET(request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const showInactive = session?.user?.role === 'admin'; // Only admin can see inactive products

  try {
    let conditions = [];

    // Search query
    if (q) {
      conditions.push(
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.sku, `%${q}%`),
          ilike(products.category, `%${q}%`)
        )
      );
    }

    // Category filter
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Active status filter
    if (session?.user?.role === 'seller') {
      conditions.push(
        or(
          eq(products.isActive, true),
          eq(products.sellerId, session.user.id)
        )
      );
    } else if (session?.user?.role !== 'admin') {
      conditions.push(eq(products.isActive, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.products.findMany({
      where: whereClause,
      with: {
        seller: {
          columns: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Create a new product (Admin or Seller)
export async function POST(request) {
  const session = await auth();

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'seller')) {
    return NextResponse.json({ error: 'Unauthorized. Admin or Seller role required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, sku, category, description, baseUnit, basePricePerUnit, stockQuantity } = body;

    // Basic validation
    if (!name || !baseUnit || !basePricePerUnit || stockQuantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields: name, baseUnit, basePricePerUnit, stockQuantity' }, { status: 400 });
    }

    if (!['g', 'mL', 'unit'].includes(baseUnit)) {
      return NextResponse.json({ error: "Invalid baseUnit. Must be 'g', 'mL', or 'unit'" }, { status: 400 });
    }

    // Parse to ensure valid float format
    const price = parseFloat(basePricePerUnit);
    const stock = parseFloat(stockQuantity);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'Price and quantity must be non-negative numbers' }, { status: 400 });
    }

    // Assign sellerId if listed by a Seller user
    const listingSellerId = session.user.role === 'seller' ? session.user.id : null;

    const [newProduct] = await db.insert(products).values({
      name,
      sku: sku || null,
      category: category || null,
      description: description || null,
      baseUnit,
      basePricePerUnit: price.toString(),
      stockQuantity: stock.toString(),
      isActive: true,
      sellerId: listingSellerId
    }).returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    // Handle SKU unique constraint failure
    if (err.message && err.message.includes('unique constraint')) {
      return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
