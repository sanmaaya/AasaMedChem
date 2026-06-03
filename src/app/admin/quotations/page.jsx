'use client';

import React, { useState, useEffect } from 'react';
import QuotationTable from '@/components/QuotationTable.jsx';
import { FileText, RefreshCw, Filter } from 'lucide-react';

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/quotations', window.location.origin);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch quotations');
      const data = await res.json();
      setQuotations(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Quotations Manager</h2>
        <p className="text-sm text-slate-500 mt-1">Review sales requests, check inventory allocations, and approve or reject active quotations.</p>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-center shadow-xs">
        <div className="flex items-center space-x-2 text-slate-400 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-550 font-bold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved / Order Confirmed</option>
          <option value="rejected">Rejected / Cancelled</option>
        </select>

        <button
          onClick={fetchQuotations}
          className="ml-auto p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
          title="Refresh quotations list"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <QuotationTable quotations={quotations} role="admin" />
      )}
    </div>
  );
}
