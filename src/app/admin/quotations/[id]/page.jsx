'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Briefcase, 
  Calendar, 
  AlertCircle, 
  Check, 
  X, 
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units.js';

export default function AdminQuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchQuotationDetails = async () => {
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
  };

  useEffect(() => {
    if (id) {
      fetchQuotationDetails();
    }
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    const confirmationText = newStatus === 'approved' 
      ? 'Are you sure you want to APPROVE this quotation? This will lock in pricing and decrement stock.' 
      : 'Are you sure you want to REJECT this quotation?';

    if (!confirm(confirmationText)) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`/api/quotations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update quotation status');
      }

      setSuccessMsg(`Quotation has been successfully ${newStatus}!`);
      // Reload current quotation data to show updated status
      await fetchQuotationDetails();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading quotation profile...</p>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link
          href="/admin/quotations"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Quotations
        </Link>
        <div className="bg-red-50 text-red-750 border border-red-200 rounded-xl p-4 font-semibold text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          href="/admin/quotations"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Quotations
        </Link>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">
            {new Date(quotation.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-400 font-mono">QUOTATION ID: #{quotation.id.toUpperCase()}</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Review Request</h2>
        </div>
        <div className="flex items-center">
          <span className={`text-xs font-black uppercase px-3.5 py-1 rounded-full border ${getStatusBadge(quotation.status)}`}>
            {quotation.status}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 text-sm font-semibold flex items-center">
          <Check className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-xl p-4 text-sm font-semibold flex items-start">
          <AlertCircle className="h-5 w-5 text-rose-600 mr-2 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Execution Failed!</strong>
            <p className="text-rose-700 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Seller and Buyer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Seller Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Created By (Seller Agent)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Intermediary Details</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Name:</span>
              <strong className="text-slate-800">{quotation.seller?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Email:</span>
              <strong className="text-slate-800">{quotation.seller?.email}</strong>
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Prepared For (Buyer Customer)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Target Account Details</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Name:</span>
              <strong className="text-slate-800">{quotation.buyer?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Email:</span>
              <strong className="text-slate-800">{quotation.buyer?.email}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-slate-550" />
          <h3 className="font-bold text-slate-800 text-sm">Quotation Line Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Product Name</th>
                <th className="py-3 px-5">Ordered Quantity</th>
                <th className="py-3 px-5">Internal Base Quantity</th>
                <th className="py-3 px-5">Unit Price (at order)</th>
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
                  <td className="py-4 px-5 text-slate-500 font-semibold">
                    {parseFloat(item.baseQuantity).toFixed(2)} {getUnitLabel(item.product?.baseUnit || item.orderedUnit === 'kg' ? 'g' : item.orderedUnit === 'L' ? 'mL' : item.orderedUnit)}
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
                <td colSpan="4" className="py-4 px-5 text-right uppercase text-xs tracking-wider">Grand Total (INR):</td>
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

      {/* Admin Actions Panel */}
      {quotation.status === 'pending' && (
        <div className="bg-slate-800 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
          <div>
            <h4 className="font-bold text-base">Authorize Quotation</h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Verify stock levels above before confirming. Approval decrements inventory.
            </p>
          </div>
          <div className="flex space-x-3 shrink-0">
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-slate-700 hover:bg-red-700 border border-slate-600 hover:border-red-655 text-white text-sm font-bold rounded-lg transition-all flex items-center cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" /> Reject Quotation
            </button>
            <button
              onClick={() => handleStatusChange('approved')}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-lg transition-all flex items-center shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Working...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Approve & Allocate Stock
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
