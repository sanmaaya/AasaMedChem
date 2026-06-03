import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import { users, auditLogs } from '@/lib/schema';
import { eq, ne } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { auth } from '@/auth';

/**
 * GET /api/users - List all users (admin only)
 * Query params: role, page, limit, search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build where clause
    let whereConditions = [];
    if (role && ['admin', 'seller', 'buyer'].includes(role)) {
      whereConditions.push(eq(users.role, role));
    }

    // Fetch users
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        company: users.company,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(limit)
      .offset(offset);

    // Get count
    const countResult = await db
      .select({ count: users.id })
      .from(users);

    return NextResponse.json({
      data: allUsers,
      pagination: {
        page,
        limit,
        total: countResult.length,
        pages: Math.ceil(countResult.length / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/:id/role
 * Change user role (admin only)
 * Body: { role: 'admin' | 'seller' | 'buyer' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2]; // Extract from /api/users/:id/role
    const action = pathParts[pathParts.length - 1]; // 'role', 'activate', etc.

    // Prevent admin from removing their own admin role
    if (userId === session.user.id && action === 'role') {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const { role, isActive } = await request.json();

    if (action === 'role') {
      if (!['admin', 'seller', 'buyer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const updated = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        });

      if (updated.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Log audit event
      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: 'change_user_role',
        entityType: 'user',
        entityId: userId,
        changes: `Role changed to ${role}`,
      });

      return NextResponse.json(updated[0]);
    }

    if (action === 'activate') {
      const updated = await db
        .update(users)
        .set({ isActive })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          isActive: users.isActive,
        });

      if (updated.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Log audit event
      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: isActive ? 'activate_user' : 'deactivate_user',
        entityType: 'user',
        entityId: userId,
        changes: `User ${isActive ? 'activated' : 'deactivated'}`,
      });

      return NextResponse.json(updated[0]);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/:id/reset-password
 * Send password reset link (admin only)
 * Body: { email }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 1]; // 'reset-password'

    if (action === 'reset-password') {
      const { email } = await request.json();

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      // Find user by email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Generate reset token (in production, store this and send via email)
      const resetToken = Buffer.from(user[0].id).toString('base64');

      // Log audit event
      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: 'request_password_reset',
        entityType: 'user',
        entityId: user[0].id,
        changes: `Password reset requested by admin`,
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset link sent',
        resetToken, // In production, don't return this - send via email
        resetUrl: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
