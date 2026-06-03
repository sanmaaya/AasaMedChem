import { db } from './db.js';
import { notifications } from './schema.js';

/**
 * Sends a mock email notification.
 * Prints the email body to the server console and creates a corresponding in-app alert.
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject line
 * @param {string} params.body - Email body contents
 * @param {string} [params.userId] - Recipient user UUID for linking in-app alert
 */
export async function sendEmail({ to, subject, body, userId }) {
  console.log(`
┌────────────────────────────────────────────────────────┐
│                   MOCK EMAIL SENT                      │
├────────────────────────────────────────────────────────┤
│ To:      ${to.padEnd(46)}│
│ Subject: ${subject.padEnd(46)}│
├────────────────────────────────────────────────────────┤
│ Body:                                                  │
│ ${body.split('\n').join('\n│ ').padEnd(55)}│
└────────────────────────────────────────────────────────┘
  `);

  if (userId) {
    try {
      await db.insert(notifications).values({
        userId,
        title: subject,
        message: body,
        isRead: false,
      });
    } catch (err) {
      console.error('Failed to auto-create in-app notification from mock email:', err);
    }
  }
}
