import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db.js';
import { quotations } from '@/lib/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { formatCurrency } from '@/lib/units.js';
import { auth } from '@/auth.js';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Inbox 
} from 'lucide-react';

export const revalidate = 0; // Disable caching

export default async function BuyerDashboardPage() {
  const session = await auth();
  const buyerId = session.user.id;

  // Run queries in parallel
  const [
    [totalResult],
    [approvedResult],
    [pendingResult],
    approvedListForValue,
    recentQuotations
  ] = await Promise.all([
    db.select({ value: sql`count(*)` }).from(quotations).where(eq(quotations.buyerId, buyerId)),
    db.select({ value: sql`count(*)` }).from(quotations).where(and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'approved'))),
    db.select({ value: sql`count(*)` }).from(quotations).where(and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'pending'))),
    db.select({ amount: quotations.totalAmount }).from(quotations).where(and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'approved'))),
    db.query.quotations.findMany({
      where: eq(quotations.buyerId, buyerId),
      with: {
        seller: { columns: { name: true } }
      },
      limit: 3,
      orderBy: (quotations, { desc }) => [desc(quotations.createdAt)]
    })
  ]);

  const totalQuotes = parseInt(totalResult?.value || '0');
  const approvedQuotes = parseInt(approvedResult?.value || '0');
  const pendingQuotes = parseInt(pendingResult?.value || '0');

  // Sum total value of approved orders
  let approvedValue = new Decimal(0);
  for (const item of approvedListForValue) {
    approvedValue = approvedValue.add(new Decimal(item.amount || 0));
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Customer Portal</h2>
        <p className="text-sm text-slate-500 mt-1">Welcome back. View approved quotations, check pending review updates, and track orders.</p>
      </div>

      {/* Empty State Check */}
      {totalQuotes === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
          <Inbox className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">No Quotations Received Yet</h3>
          <p className="text-slate-400 text-xs mt-1 px-8 max-w-md mx-auto">
            Your account does not have any active quotations. All sales operations flow through an authorized Seller representative. Contact your Seller agent to draft an order.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Quotes Received */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
                <FileText className="h-5 w-5 text-slate-550" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">{totalQuotes}</h3>
                <p className="text-xs text-slate-400 mt-1">Quotations created for you</p>
              </div>
            </div>

            {/* Approved Count */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Orders</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">{approvedQuotes}</h3>
                <p className="text-xs text-slate-400 mt-1">Confirmed purchase records</p>
              </div>
            </div>

            {/* Pending Count */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Awaiting Review</span>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">{pendingQuotes}</h3>
                <p className="text-xs text-slate-400 mt-1">Awaiting admin authorization</p>
              </div>
            </div>

            {/* Approved Value */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Value</span>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-850 truncate">{formatCurrency(approvedValue.toNumber())}</h3>
                <p className="text-xs text-slate-400 mt-1">Total value of confirmed items</p>
              </div>
            </div>
          </div>

          {/* Recent list */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-805 text-lg">Recent Sales Transactions</h3>
                <p className="text-xs text-slate-400">Updates on the last 3 quotations prepared by your agent</p>
              </div>
              <Link
                href="/buyer/quotations"
                className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
              >
                All Orders <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentQuotations.map((quote) => (
                <div key={quote.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Quotation #{quote.id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Seller agent: <span className="font-semibold text-slate-655">{quote.seller?.name}</span> • Created {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      quote.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      quote.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {quote.status}
                    </span>
                    <strong className="text-sm font-black text-slate-800">
                      {formatCurrency(quote.totalAmount)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
