import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { db } from '@/lib/db.js';
import { users } from '@/lib/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// GET /api/users - Fetch users by role (Accessible to Admin and Seller)
export async function GET(request) {
  const session = await auth();

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'seller')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  try {
    let query = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      businessInfo: users.businessInfo,
      createdAt: users.createdAt
    }).from(users);

    if (role) {
      if (!['admin', 'seller', 'buyer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 });
      }
      query = query.where(eq(users.role, role));
    }

    const list = await query;
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new Seller or Buyer account (Admin Only)
export async function POST(request) {
  const session = await auth();

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, password, name, role' }, { status: 400 });
    }

    if (!['seller', 'buyer'].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Admin can only create 'seller' or 'buyer' accounts." }, { status: 400 });
    }

    // Check if email already registered
    const [existing] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'An account with this email is already registered.' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name,
      role,
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error("POST /api/users error:", err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
