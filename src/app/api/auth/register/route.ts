import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// POST /api/auth/register - Register a new Seller representative (Public)
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, businessName, licenseNumber, notes } = body;

    // 1. Validation
    if (!email || !password || !name || !businessName || !licenseNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, businessName, licenseNumber' }, 
        { status: 400 }
      );
    }

    // 2. Check if email already registered
    const [existing] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email is already registered.' }, 
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Compile business metadata
    const businessDataStr = JSON.stringify({
      businessName: businessName.trim(),
      licenseNumber: licenseNumber.trim(),
      notes: notes?.trim() || ''
    });

    // 5. Insert Seller account
    const [newUser] = await db.insert(users).values({
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      name: name.trim(),
      role: 'seller',
      businessInfo: businessDataStr,
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json({ error: 'Failed to complete registration' }, { status: 500 });
  }
}
