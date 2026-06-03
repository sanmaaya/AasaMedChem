'use client';

import React, { useState, useEffect } from 'react';
import QuotationTable from '@/components/QuotationTable.jsx';
import { FileText, RefreshCw } from 'lucide-react';

export default function SellerQuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotations');
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
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Quotations History</h2>
          <p className="text-sm text-slate-500 mt-1">Review the status and details of quotations you have submitted for Buyer approval.</p>
        </div>
        <button
          onClick={fetchQuotations}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
          title="Refresh quotations list"
        >
          <RefreshCw className="h-5 w-5" />
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
        <QuotationTable quotations={quotations} role="seller" />
      )}
    </div>
  );
}
