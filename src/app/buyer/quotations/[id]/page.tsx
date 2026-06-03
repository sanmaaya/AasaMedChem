'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  Briefcase, 
  Calendar, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units';

export default function BuyerQuotationDetailPage() {
  const params = useParams();
  const { id } = params;

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchQuotationDetails() {
      try {
        setLoading(true);
        const res = await fetch('/api/quotations');
        if (!res.ok) throw new Error('Failed to load quotations');
        
        const list = await res.json();
        const quote = list.find(q => q.id === id);
        
        if (!quote) {
          setError('Quotation record not found.');
        } else {
          setQuotation(quote);
        }
      } catch (err) {
        console.error(err);
        setError('Error loading quotation details.');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchQuotationDetails();
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-705 border border-amber-200 uppercase">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-705 border border-emerald-250 uppercase">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-750 border border-rose-250 uppercase">
            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 uppercase">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-550 font-medium text-sm">Loading quotation profile...</p>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link
          href="/buyer/quotations"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to History
        </Link>
        <div className="bg-red-50 text-red-750 border border-red-200 rounded-xl p-4 font-semibold text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          href="/buyer/quotations"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to History
        </Link>
        
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-550">
          <Calendar className="h-4 w-4 text-slate-450" />
          <span>{new Date(quotation.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-400 font-mono">QUOTATION ID: #{quotation.id.toUpperCase()}</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Transaction Details</h2>
        </div>
        <div className="flex items-center">
          {getStatusBadge(quotation.status)}
        </div>
      </div>

      {/* Seller Agent Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Assigned Seller Agent</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Intermediary Contact Profiles</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between sm:justify-start sm:space-x-8">
            <span className="text-slate-400 font-medium sm:w-20">Name:</span>
            <strong className="text-slate-850">{quotation.seller?.name}</strong>
          </div>
          <div className="flex justify-between sm:justify-start sm:space-x-8">
            <span className="text-slate-400 font-medium sm:w-20">Email:</span>
            <strong className="text-slate-850">{quotation.seller?.email}</strong>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-slate-500" />
          <h3 className="font-bold text-slate-800 text-sm">Quotation Line Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Product Name</th>
                <th className="py-3 px-5">Ordered Quantity</th>
                <th className="py-3 px-5">Unit Price</th>
                <th className="py-3 px-5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {quotation.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/20">
                  <td className="py-4 px-5">
                    <p className="font-bold text-slate-800">{item.product?.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.product?.sku || 'N/A'}</p>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-700">
                    {parseFloat(item.orderedQuantity).toFixed(2)} {getUnitLabel(item.orderedUnit)}
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">
                    {formatCurrency(item.unitPriceAtOrder)} / {getUnitLabel(item.orderedUnit)}
                  </td>
                  <td className="py-4 px-5 text-right font-black text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/50 font-bold text-slate-800 border-t border-slate-200">
                <td colSpan="3" className="py-4 px-5 text-right uppercase text-xs tracking-wider">Grand Total (INR):</td>
                <td className="py-4 px-5 text-right text-lg font-black text-blue-600">
                  {formatCurrency(quotation.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes block */}
      {quotation.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quotation Notes / Terms</h4>
          <p className="text-sm text-slate-650 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
            {quotation.notes}
          </p>
        </div>
      )}
    </div>
  );
}
