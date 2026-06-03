import { db } from './db';
import { auditLogs } from './schema';

/**
 * Logs a business action to the database audit trail.
 * @param {string|null} userId - The user ID who performed the action
 * @param {string} action - The action identifier (e.g. 'PRODUCT_CREATED')
 * @param {object|string|null} details - Additional metadata for debugging or logging
 */
export async function logAction(userId, action, details) {
  try {
    const detailsString = details 
      ? (typeof details === 'string' ? details : JSON.stringify(details)) 
      : null;

    await db.insert(auditLogs).values({
      userId: userId || null,
      action,
      details: detailsString,
    });
    
    console.log(`[AUDIT] Action: ${action} by User: ${userId || 'SYSTEM'}. Details: ${detailsString || 'None'}`);
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
