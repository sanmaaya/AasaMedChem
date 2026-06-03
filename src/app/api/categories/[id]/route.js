import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { db } from '@/lib/db.js';
import { categories } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { logAction } from '@/lib/audit.js';

// PUT /api/categories/[id] - Update a category (Admin Only)
export async function PUT(request, { params }) {
  const session = await auth();
  const { id } = params;

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

    // Check if category exists
    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // Check unique constraint excluding self
    const [duplicate] = await db.select().from(categories).where(eq(categories.name, trimmedName)).limit(1);
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: 'Another category with this name already exists.' }, { status: 409 });
    }

    const [updated] = await db.update(categories)
      .set({ name: trimmedName })
      .where(eq(categories.id, id))
      .returning();

    await logAction(session.user.id, 'CATEGORY_UPDATED', { categoryId: id, oldName: existing.name, newName: trimmedName });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(`PUT /api/categories/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to update category.' }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Delete a category (Admin Only)
export async function DELETE(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
  }

  try {
    // Check if category exists
    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    await db.delete(categories).where(eq(categories.id, id));

    await logAction(session.user.id, 'CATEGORY_DELETED', { categoryId: id, categoryName: existing.name });

    return NextResponse.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error(`DELETE /api/categories/${id} error:`, err);
    return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 });
  }
}
