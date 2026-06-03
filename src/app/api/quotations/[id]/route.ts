import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { quotations, users, quotationItems, products } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/quotations/[id] - Retrieve a single quotation with details
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  try {
    const quotation = await db.query.quotations.findFirst({
      where: eq(quotations.id, id),
      with: {
        seller: { columns: { id: true, name: true, email: true } },
        buyer: { columns: { id: true, name: true, email: true } },
        items: {
          with: {
            product: { columns: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: [desc(quotations.createdAt)],
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (err: any) {
    console.error('GET /api/quotations/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}
