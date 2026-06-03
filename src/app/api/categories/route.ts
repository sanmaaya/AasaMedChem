import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { logAction } from '@/lib/audit';

// GET /api/categories - Fetch all categories
export async function GET(request) {
  try {
    const list = await db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)]
    });
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create a category (Admin Only)
export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check unique constraint
    const [existing] = await db.select().from(categories).where(eq(categories.name, trimmedName)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }

    const [newCategory] = await db.insert(categories).values({
      name: trimmedName
    }).returning();

    await logAction(session.user.id, 'CATEGORY_CREATED', { categoryId: newCategory.id, categoryName: trimmedName });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (err) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
  }
}
