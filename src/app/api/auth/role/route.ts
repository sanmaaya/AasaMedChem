import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// POST /api/auth/role - Fetch role for a specific email before signing in (Public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ role: user.role });
  } catch (err: any) {
    console.error('POST /api/auth/role error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
