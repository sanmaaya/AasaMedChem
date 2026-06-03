import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { products, quotations, users, auditLogs } from '@/lib/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { formatCurrency } from '@/lib/units';
import {
  Package, FileText, Users as UsersIcon, Boxes,
  ArrowRight, Clock, TrendingUp, UserCheck, Shield,
  FlaskConical, Activity
} from 'lucide-react';
import { RevenueChart, OrderVolumeChart, CategoryPieChart } from '@/components/AdminCharts';

export const revalidate = 0;

// Build last-6-months labels
function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString('en-IN', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

export default async function AdminDashboardPage() {
  const [
    [productsResult],
    [pendingQuoteResult],
    [buyersResult],
    [sellersResult],
    activeProductsForValue,
    recentPending,
    allApprovedQuotations,
    recentAuditActivity
  ] = await Promise.all([
    db.select({ value: sql`count(*)` }).from(products).where(eq(products.isActive, true)),
    db.select({ value: sql`count(*)` }).from(quotations).where(eq(quotations.status, 'pending')),
    db.select({ value: sql`count(*)` }).from(users).where(eq(users.role, 'buyer')),
    db.select({ value: sql`count(*)` }).from(users).where(eq(users.role, 'seller')),
    db.select({ stock: products.stockQuantity, price: products.basePricePerUnit }).from(products).where(eq(products.isActive, true)),
    db.query.quotations.findMany({
      where: eq(quotations.status, 'pending'),
      with: { seller: { columns: { name: true } }, buyer: { columns: { name: true } } },
      limit: 5,
      orderBy: (q, { desc }) => [desc(q.createdAt)]
    }),
    db.query.quotations.findMany({
      where: eq(quotations.status, 'approved'),
      with: { items: { with: { product: { columns: { category: true } } } } }
    }),
    db.query.auditLogs.findMany({
      with: { user: { columns: { name: true, role: true } } },
      orderBy: [desc(auditLogs.createdAt)],
      limit: 8,
    })
  ]);

  const activeProductsCount = parseInt(String(productsResult?.value ?? '0'), 10);
  const pendingQuotationsCount = parseInt(String(pendingQuoteResult?.value ?? '0'), 10);
  const totalBuyers = parseInt(String(buyersResult?.value ?? '0'), 10);
  const totalSellers = parseInt(String(sellersResult?.value ?? '0'), 10);

  let totalInventoryValue = new Decimal(0);
  for (const item of activeProductsForValue) {
    totalInventoryValue = totalInventoryValue.add(new Decimal(item.stock || 0).mul(new Decimal(item.price || 0)));
  }

  // Revenue & order volume by month (approximate — group by created_at month)
  const monthBuckets = getLast6Months();
  const revenueByMonth = monthBuckets.map(m => {
    const relevant = allApprovedQuotations.filter(q => {
      const d = new Date(q.createdAt);
      return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
    });
    const rev = relevant.reduce((s, q) => s + parseFloat(q.totalAmount || 0), 0);
    return { month: m.label, revenue: rev, orders: relevant.length };
  });

  // Category breakdown for pie chart
  const catTotals = {};
  for (const q of allApprovedQuotations) {
    for (const item of q.items || []) {
      const cat = item.product?.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + parseFloat(item.lineTotal || 0);
    }
  }
  const categoryPieData = Object.entries(catTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const totalApprovedRevenue = allApprovedQuotations.reduce((s, q) => s + parseFloat(q.totalAmount || 0), 0);

  const ACTION_LABEL = {
    'QUOTATION_APPROVED': '✅ Approved quotation',
    'QUOTATION_REJECTED': '❌ Rejected quotation',
    'PRODUCT_CREATED': '📦 Created product',
    'PRODUCTS_CSV_IMPORT': '📥 Bulk CSV import',
    'CATEGORY_CREATED': '🏷️ New category',
    'CATEGORY_DELETED': '🗑️ Deleted category',
    'QUOTATION_COMMENT_ADDED': '💬 Added comment',
    'QUOTATION_ORDER_STATUS_CHANGE': '🚚 Updated order status',
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Admin Console</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of catalogue, users, quotations, and revenue analytics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Products', value: activeProductsCount, icon: <Package className="h-5 w-5" />, color: 'text-foreground', sub: 'In catalogue' },
          { label: 'Pending Quotes', value: pendingQuotationsCount, icon: <Clock className="h-5 w-5 animate-pulse" />, color: 'text-amber-600', sub: 'Awaiting review' },
          { label: 'Total Buyers', value: totalBuyers, icon: <UsersIcon className="h-5 w-5" />, color: 'text-emerald-600', sub: 'Customer profiles' },
          { label: 'Total Sellers', value: totalSellers, icon: <UserCheck className="h-5 w-5" />, color: 'text-blue-600', sub: 'Agent accounts' },
          { label: 'Inventory Value', value: formatCurrency(totalInventoryValue.toNumber()), icon: <Boxes className="h-5 w-5" />, color: 'text-violet-600', sub: 'Active stock', isLarge: true },
        ].map((card, i) => (
          <div key={i} className={`bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-36 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <div>
              <h3 className={`font-black text-foreground ${card.isLarge ? 'text-lg' : 'text-3xl'}`}>{card.value}</h3>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground text-base">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Approved quotation value — last 6 months</p>
            </div>
            <span className="text-xs font-bold text-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
              Total: {formatCurrency(totalApprovedRevenue)}
            </span>
          </div>
          <RevenueChart data={revenueByMonth} />
        </div>

        {/* Category Pie */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-foreground text-base">Revenue by Category</h3>
            <p className="text-xs text-muted-foreground">Approved orders breakdown</p>
          </div>
          {categoryPieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">No approved orders yet</div>
          ) : (
            <CategoryPieChart data={categoryPieData} />
          )}
        </div>
      </div>

      {/* Order Volume Bar */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="font-bold text-foreground text-base">Monthly Order Volume</h3>
          <p className="text-xs text-muted-foreground">Number of approved quotations per month</p>
        </div>
        <OrderVolumeChart data={revenueByMonth} />
      </div>

      {/* Bottom grid: Pending Queue + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Quotations Queue */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-role-accent" /> Pending Queue
              </h3>
              <p className="text-xs text-muted-foreground">Quotations awaiting admin action</p>
            </div>
            <Link href="/admin/quotations" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center bg-secondary px-3 py-1.5 rounded-lg border border-border transition">
              All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentPending.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-semibold">🎉 All caught up! No pending quotes.</div>
            ) : recentPending.map(quote => (
              <div key={quote.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-foreground">#{quote.id.substring(0,8).toUpperCase()} — {quote.buyer?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">via {quote.seller?.name?.split(' ')[0]} • {new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-foreground">{formatCurrency(quote.totalAmount)}</span>
                  <Link href={`/admin/quotations/${quote.id}`} className="text-xs font-bold bg-role-primary text-role-primary-foreground px-2.5 py-1 rounded-lg transition hover:opacity-90">Review</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-role-accent" /> Activity Feed
              </h3>
              <p className="text-xs text-muted-foreground">Recent system actions</p>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center bg-secondary px-3 py-1.5 rounded-lg border border-border transition">
              All Logs <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAuditActivity.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No activity recorded yet.</p>
            ) : recentAuditActivity.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm">
                  {(ACTION_LABEL[log.action] || '⚙️').split(' ')[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-snug">
                    {ACTION_LABEL[log.action]?.split(' ').slice(1).join(' ') || log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {log.user?.name || 'System'} • {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
