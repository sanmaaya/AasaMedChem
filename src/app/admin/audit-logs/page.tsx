import React from 'react';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { Shield, User } from 'lucide-react';

export const revalidate = 0;

const ACTION_COLORS = {
  'QUOTATION_APPROVED':        'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'QUOTATION_REJECTED':        'bg-red-500/10 text-red-700 border-red-500/20',
  'QUOTATION_ORDER_STATUS_CHANGE': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  'PRODUCT_CREATED':           'bg-violet-500/10 text-violet-700 border-violet-500/20',
  'PRODUCTS_CSV_IMPORT':       'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  'CATEGORY_CREATED':          'bg-teal-500/10 text-teal-700 border-teal-500/20',
  'CATEGORY_UPDATED':          'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
  'CATEGORY_DELETED':          'bg-orange-500/10 text-orange-700 border-orange-500/20',
  'QUOTATION_COMMENT_ADDED':   'bg-sky-500/10 text-sky-700 border-sky-500/20',
};

export default async function AuditLogsPage() {
  const logs = await db.query.auditLogs.findMany({
    with: { user: { columns: { name: true, role: true, email: true } } },
    orderBy: [desc(auditLogs.createdAt)],
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7 text-role-accent" /> System Audit Log
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Full timeline of all critical system actions. Last 100 entries shown.</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Shield className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Performed By</th>
                  <th className="py-3.5 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {logs.map(log => {
                  let details = null;
                  try { details = log.details ? JSON.parse(log.details) : null; } catch {}
                  const colorClass =
                    ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] ||
                    'bg-secondary text-muted-foreground border-border';
                  const actor = Array.isArray(log.user) ? log.user[0] : log.user;
                  return (
                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 px-5 text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colorClass}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {actor ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{actor.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{actor.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">SYSTEM</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {details ? (
                          <code className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-1 rounded block max-w-xs truncate">
                            {JSON.stringify(details)}
                          </code>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
