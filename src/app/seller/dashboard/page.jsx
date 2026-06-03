'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, TrendingUp, CheckCircle2, Clock, XCircle,
  ArrowRight, Plus, ShoppingBag, Activity, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString('en-IN', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name.toLowerCase().includes('revenue') ? INR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function SellerDashboardPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quotations')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setQuotations(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = {
    total:     quotations.length,
    pending:   quotations.filter(q => q.status === 'pending').length,
    approved:  quotations.filter(q => q.status === 'approved').length,
    rejected:  quotations.filter(q => q.status === 'rejected').length,
    revenue:   quotations.filter(q => q.status === 'approved').reduce((s, q) => s + parseFloat(q.totalAmount || 0), 0),
  };

  const monthBuckets = getLast6Months();
  const revenueData = monthBuckets.map(m => {
    const rel = quotations.filter(q => {
      const d = new Date(q.createdAt);
      return q.status === 'approved' && d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
    });
    return { month: m.label, revenue: rel.reduce((s, q) => s + parseFloat(q.totalAmount || 0), 0), count: rel.length };
  });

  const submittedData = monthBuckets.map(m => {
    const rel = quotations.filter(q => {
      const d = new Date(q.createdAt);
      return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
    });
    return { month: m.label, submitted: rel.length };
  });

  const recentQuotes = [...quotations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const STATUS_BADGE = {
    pending:  'bg-amber-500/10 text-amber-700 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 text-role-accent animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Seller Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of your quotation performance and approved revenue.</p>
        </div>
        <Link href="/seller/quotations/new" className="inline-flex items-center bg-role-primary text-role-primary-foreground font-bold px-4 py-2 rounded-xl text-sm transition hover:opacity-90 shadow-md">
          <Plus className="h-4 w-4 mr-2" /> New Quotation
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Submitted', value: stats.total, icon: <FileText className="h-5 w-5" />, color: 'text-foreground' },
          { label: 'Pending Review', value: stats.pending, icon: <Clock className="h-5 w-5 animate-pulse" />, color: 'text-amber-600' },
          { label: 'Approved', value: stats.approved, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-emerald-600' },
          { label: 'Rejected', value: stats.rejected, icon: <XCircle className="h-5 w-5" />, color: 'text-red-600' },
          { label: 'Approved Revenue', value: INR(stats.revenue), icon: <TrendingUp className="h-5 w-5" />, color: 'text-violet-600', isLarge: true },
        ].map((c, i) => (
          <div key={i} className={`bg-card border border-border p-5 rounded-xl shadow-xs flex flex-col justify-between h-36 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">{c.label}</span>
              <span className={c.color}>{c.icon}</span>
            </div>
            <div>
              <h3 className={`font-black text-foreground ${c.isLarge ? 'text-lg' : 'text-3xl'}`}>{c.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h3 className="font-bold text-foreground text-base mb-1">Approved Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly revenue from approved quotations</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="sellerRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#094f44" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#094f44" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#094f44" fill="url(#sellerRevGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#094f44' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Submissions per month */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h3 className="font-bold text-foreground text-base mb-1">Monthly Submissions</h3>
          <p className="text-xs text-muted-foreground mb-4">Quotations submitted per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={submittedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="submitted" name="Submitted" fill="#c5a880" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Quotations */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-base flex items-center gap-2"><Activity className="h-5 w-5 text-role-accent" /> Recent Quotations</h3>
          <Link href="/seller/quotations" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center bg-secondary px-3 py-1.5 rounded-lg border border-border">
            All <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
        {recentQuotes.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No quotations yet. Start by creating your first one.</p>
            <Link href="/seller/quotations/new" className="inline-flex items-center mt-3 text-sm font-bold text-role-primary hover:underline">
              <Plus className="h-4 w-4 mr-1" /> Create Quotation
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentQuotes.map(q => (
              <div key={q.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-foreground">#{q.id.substring(0,8).toUpperCase()} — {q.buyer?.name || 'Unknown Buyer'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(q.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-foreground">{INR(q.totalAmount)}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${STATUS_BADGE[q.status]}`}>{q.status}</span>
                  <Link href={`/seller/quotations/${q.id}`} className="text-xs font-bold text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded-lg border border-border">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
