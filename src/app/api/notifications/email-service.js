import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import { quotations, users, auditLogs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';
import { auth } from '@/auth';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * POST /api/quotations/:id/email
 * Send quotation via email
 * Body: { toEmail, subject, message }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const quotationId = pathParts[pathParts.length - 2]; // Extract from /api/quotations/:id/email

    const { toEmail, subject, message } = await request.json();

    if (!toEmail || !toEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Fetch quotation
    const quotation = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    if (quotation.length === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Verify permissions
    if (
      session.user.role !== 'admin' &&
      session.user.id !== quotation[0].sellerId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch seller info
    const seller = await db
      .select()
      .from(users)
      .where(eq(users.id, quotation[0].sellerId))
      .limit(1);

    // Generate quotation link
    const shareUrl = `${process.env.NEXTAUTH_URL}/buyer/quotations/${quotationId}`;

    // Build email HTML
    const emailHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0; }
            .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Quotation from ${seller[0]?.name || 'AasaMedChem'}</h1>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>${message || 'Please find the quotation details below.'}</p>
              <p><strong>Quotation Details:</strong></p>
              <ul>
                <li>Quotation ID: ${quotationId.substring(0, 8).toUpperCase()}</li>
                <li>Total Amount: $${quotation[0].totalAmount}</li>
                <li>Status: ${quotation[0].status}</li>
                <li>Expires: ${quotation[0].expiresAt?.toLocaleDateString('en-IN')}</li>
              </ul>
              
              <p><a href="${shareUrl}" class="button">View Quotation</a></p>
              
              <p>If you have any questions, please reply to this email or contact ${seller[0]?.email}.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from AasaMedChem Platform.</p>
              <p>&copy; ${new Date().getFullYear()} AasaMedChem. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via SendGrid
    const emailResult = await sgMail.send({
      to: toEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: subject || `Quotation from ${seller[0]?.name || 'AasaMedChem'}`,
      html: emailHTML,
      replyTo: seller[0]?.email || SENDGRID_FROM_EMAIL,
    });

    // Log audit event
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'send_quotation_email',
      entityType: 'quotation',
      entityId: quotationId,
      changes: `Sent quotation email to ${toEmail}`,
    });

    return NextResponse.json({
      success: true,
      messageId: emailResult[0].headers['x-message-id'],
      sentTo: toEmail,
    });
  } catch (error) {
    console.error('POST /api/quotations/:id/email error:', error);
    
    // Check for SendGrid-specific errors
    if (error.response?.errors) {
      return NextResponse.json(
        { error: error.response.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/send
 * Send general notification email (newsletter, alerts, etc.)
 * Body: { recipients: ['email@example.com'], subject, message }
 */
export async function sendNotificationEmail(recipients: string[], subject: string, htmlMessage: string) {
  try {
    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      throw new Error('Email service not configured');
    }

    const emailResult = await sgMail.sendMultiple({
      to: recipients,
      from: SENDGRID_FROM_EMAIL,
      subject,
      html: htmlMessage,
    });

    return {
      success: true,
      count: emailResult.length,
    };
  } catch (error) {
    console.error('Send notification email error:', error);
    throw error;
  }
}

/**
 * GET /api/notifications/test
 * Test email configuration (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(auth);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Send test email
    await sgMail.send({
      to: session.user.email,
      from: SENDGRID_FROM_EMAIL,
      subject: 'AasaMedChem - Email Configuration Test',
      html: `
        <p>Hello ${session.user.name},</p>
        <p>This is a test email to verify that the SendGrid email service is correctly configured.</p>
        <p>If you received this email, your email service is working properly!</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      sentTo: session.user.email,
    });
  } catch (error) {
    console.error('GET /api/notifications/test error:', error);
    return NextResponse.json(
      { error: 'Test email failed: ' + error.message },
      { status: 500 }
    );
  }
}
