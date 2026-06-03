import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db.js';
import { products, quotations, users } from '@/lib/schema.js';
import { eq, sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { formatCurrency } from '@/lib/units.js';
import { 
  Package, 
  FileText, 
  Users as UsersIcon, 
  Boxes, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  UserCheck 
} from 'lucide-react';

export const revalidate = 0; // Disable caching for dashboard

export default async function AdminDashboardPage() {
  // Run queries in parallel for efficiency
  const [
    [productsResult],
    [pendingQuoteResult],
    [buyersResult],
    [sellersResult],
    activeProductsForValue
  ] = await Promise.all([
    db.select({ value: sql`count(*)` }).from(products).where(eq(products.isActive, true)),
    db.select({ value: sql`count(*)` }).from(quotations).where(eq(quotations.status, 'pending')),
    db.select({ value: sql`count(*)` }).from(users).where(eq(users.role, 'buyer')),
    db.select({ value: sql`count(*)` }).from(users).where(eq(users.role, 'seller')),
    db.select({ stock: products.stockQuantity, price: products.basePricePerUnit }).from(products).where(eq(products.isActive, true))
  ]);

  const activeProductsCount = parseInt(productsResult?.value || '0');
  const pendingQuotationsCount = parseInt(pendingQuoteResult?.value || '0');
  const totalBuyers = parseInt(buyersResult?.value || '0');
  const totalSellers = parseInt(sellersResult?.value || '0');

  // High-precision summation of inventory value
  let totalInventoryValue = new Decimal(0);
  for (const item of activeProductsForValue) {
    const stock = new Decimal(item.stock || 0);
    const price = new Decimal(item.price || 0);
    totalInventoryValue = totalInventoryValue.add(stock.mul(price));
  }

  // Fetch recent pending quotations to show on the dashboard
  const recentPending = await db.query.quotations.findMany({
    where: eq(quotations.status, 'pending'),
    with: {
      seller: { columns: { name: true } },
      buyer: { columns: { name: true } }
    },
    limit: 5,
    orderBy: (quotations, { desc }) => [desc(quotations.createdAt)]
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Console</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time overview of catalogs, active users, pending requests, and assets.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
            <Package className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{activeProductsCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Available in catalogue</p>
          </div>
        </div>

        {/* Pending Quotations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Quotes</span>
            <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{pendingQuotationsCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Awaiting admin review</p>
          </div>
        </div>

        {/* Total Buyers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Buyers</span>
            <UsersIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{totalBuyers}</h3>
            <p className="text-xs text-slate-400 mt-1">Customer profiles</p>
          </div>
        </div>

        {/* Total Sellers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sellers</span>
            <UserCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{totalSellers}</h3>
            <p className="text-xs text-slate-400 mt-1">Sales agent accounts</p>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-36 col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Asset Value</span>
            <Boxes className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 truncate">{formatCurrency(totalInventoryValue.toNumber())}</h3>
            <p className="text-xs text-slate-400 mt-1">Total inventory value</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Recent Pending Quotations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Quotations Awaiting Action</h3>
              <p className="text-xs text-slate-400">Submitted quotations that require admin review</p>
            </div>
            <Link
              href="/admin/quotations"
              className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
            >
              All Quotes <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPending.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                No quotations currently pending approval. Nice job!
              </div>
            ) : (
              recentPending.map((quote) => (
                <div key={quote.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-slate-50/30 px-1 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      #{quote.id.substring(0, 8).toUpperCase()} for {quote.buyer?.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted by: <span className="font-medium text-slate-600">{quote.seller?.name}</span> • {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-black text-slate-800">
                      {formatCurrency(quote.totalAmount)}
                    </span>
                    <Link
                      href={`/admin/quotations/${quote.id}`}
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Quick Navigation and Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">System Quick-Links</h3>
            <p className="text-xs text-slate-400">Jump to different modules instantly</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/admin/products/new"
              className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
            >
              <span>Create Product SKU</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
            >
              <span>Manage Product Catalogue</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
            >
              <span>Register Buyers & Sellers</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
