import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { quotationComments, users } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { logAction } from '@/lib/audit';

// GET /api/quotations/[id]/comments - Fetch comments for a quotation
export async function GET(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const list = await db.query.quotationComments.findMany({
      where: eq(quotationComments.quotationId, id),
      with: {
        user: {
          columns: { name: true, role: true }
        }
      },
      orderBy: [asc(quotationComments.createdAt)]
    });

    return NextResponse.json(list);
  } catch (err) {
    console.error(`GET /api/quotations/${id}/comments error:`, err);
    return NextResponse.json({ error: 'Failed to fetch comments.' }, { status: 500 });
  }
}

// POST /api/quotations/[id]/comments - Post a new comment
export async function POST(request, { params }) {
  const session = await auth();
  const { id } = params;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { comment } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'Comment body cannot be empty.' }, { status: 400 });
    }

    const [newComment] = await db.insert(quotationComments).values({
      quotationId: id,
      userId: session.user.id,
      comment: comment.trim()
    }).returning();

    // Attach user profile information for immediate front-end append
    const commentWithUser = {
      ...newComment,
      user: {
        name: session.user.name,
        role: session.user.role
      }
    };

    await logAction(session.user.id, 'QUOTATION_COMMENT_ADDED', { quotationId: id });

    return NextResponse.json(commentWithUser, { status: 201 });
  } catch (err) {
    console.error(`POST /api/quotations/${id}/comments error:`, err);
    return NextResponse.json({ error: 'Failed to add comment.' }, { status: 500 });
  }
}
