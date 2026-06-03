'use client';

import React, { useState, useEffect } from 'react';
import QuotationTable from '@/components/QuotationTable';
import { FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function SellerQuotationsPage() {
  const toast = useToast();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed to fetch quotations');
      setQuotations(await res.json());
    } catch {
      toast.error('Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Quotations History</h2>
          <p className="text-sm text-muted-foreground mt-1">Review all quotations you have submitted for buyer approval.</p>
        </div>
        <button onClick={fetchQuotations} className="p-2.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground transition cursor-pointer" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 w-full bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <FileText className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No quotations submitted yet.</p>
        </div>
      ) : (
        <QuotationTable quotations={quotations} role="seller" />
      )}
    </div>
  );
}
