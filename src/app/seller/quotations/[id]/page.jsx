'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, User, Calendar, FileSpreadsheet,
  Clock, CheckCircle2, XCircle, MessageSquare, Send, Printer,
  Package, Truck
} from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units.js';
import { useToast } from '@/components/ToastProvider.jsx';

const ORDER_STEPS = ['pending', 'packed', 'dispatched', 'delivered'];
const STEP_LABELS = ['Pending', 'Packed', 'Dispatched', 'Delivered'];
const STEP_ICONS  = [Package, Package, Truck, CheckCircle2];

export default function SellerQuotationDetailPage() {
  const params = useParams();
  const { id } = params;
  const toast = useToast();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const commentEndRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    fetch('/api/quotations')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        const q = list.find(x => x.id === id);
        if (!q) toast.error('Quotation not found.');
        setQuotation(q || null);
        setLoading(false);
      })
      .catch(() => { toast.error('Error loading quotation.'); setLoading(false); });

    fetch(`/api/quotations/${id}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then(setComments)
      .catch(() => {});
  }, [id]);

  useEffect(() => { commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      setPostingComment(true);
      const res = await fetch(`/api/quotations/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(prev => [...prev, data]);
      setCommentText('');
      toast.success('Comment added.');
    } catch (err) {
      toast.error(err.message || 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const STATUS_BADGE = {
    pending:  { cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" />, label: 'Pending Review' },
    approved: { cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />, label: 'Approved' },
    rejected: { cls: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <XCircle className="h-3.5 w-3.5 mr-1.5" />, label: 'Rejected' },
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 text-role-accent animate-spin mb-4" />
      <p className="text-muted-foreground font-medium text-sm">Loading quotation...</p>
    </div>
  );

  if (!quotation) return (
    <div className="space-y-4">
      <Link href="/seller/quotations" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Link>
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm font-semibold">Quotation not found.</div>
    </div>
  );

  const badge = STATUS_BADGE[quotation.status] || { cls: 'bg-secondary text-foreground border-border', icon: null, label: quotation.status };
  const currentStepIdx = ORDER_STEPS.indexOf(quotation.orderStatus || 'pending');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Link href="/seller/quotations" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to History
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-semibold">
            <Calendar className="h-4 w-4" />
            <span>{new Date(quotation.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
          </div>
          <Link href={`/admin/quotations/${id}/print`} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold bg-role-primary text-role-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition">
            <Printer className="h-3.5 w-3.5" /> Print
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 border border-border rounded-xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-muted-foreground font-mono">QUOTATION ID: #{quotation.id.toUpperCase()}</span>
          <h2 className="text-2xl font-black text-foreground tracking-tight mt-1">Quotation Profile</h2>
        </div>
        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black border uppercase ${badge.cls}`}>
          {badge.icon}{badge.label}
        </span>
      </div>

      {/* Order Status Tracker (for approved) */}
      {quotation.status === 'approved' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-5">Order Tracking</h4>
          <div className="flex items-start justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            {ORDER_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i];
              const isCompleted = i <= currentStepIdx;
              return (
                <div key={step} className="flex flex-col items-center gap-2 z-10 flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-role-primary border-role-primary text-role-primary-foreground' : 'bg-card border-border text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-bold text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{STEP_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Buyer Details */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><User className="h-5 w-5" /></div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Buyer Account (Customer)</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Linked Recipient Details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground font-medium">Name:</span><strong className="text-foreground">{quotation.buyer?.name}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground font-medium">Email:</span><strong className="text-foreground">{quotation.buyer?.email}</strong></div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="p-4 bg-secondary/40 border-b border-border flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-bold text-foreground text-sm">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-5">Product</th>
                <th className="py-3 px-5">Quantity</th>
                <th className="py-3 px-5">Unit Price</th>
                <th className="py-3 px-5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {quotation.items?.map(item => (
                <tr key={item.id} className="hover:bg-secondary/10">
                  <td className="py-4 px-5">
                    <p className="font-bold text-foreground">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {item.product?.sku || 'N/A'}</p>
                  </td>
                  <td className="py-4 px-5 font-bold text-foreground">{parseFloat(item.orderedQuantity).toFixed(2)} {getUnitLabel(item.orderedUnit)}</td>
                  <td className="py-4 px-5 text-muted-foreground font-medium">{formatCurrency(item.unitPriceAtOrder)} / {getUnitLabel(item.orderedUnit)}</td>
                  <td className="py-4 px-5 text-right font-black text-foreground">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-secondary/20 border-t border-border">
                <td colSpan="3" className="py-4 px-5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Grand Total (INR):</td>
                <td className="py-4 px-5 text-right text-lg font-black text-role-primary">{formatCurrency(quotation.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {quotation.notes && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes / Terms</h4>
          <p className="text-sm text-foreground font-medium bg-secondary/25 p-3 rounded-lg border border-border whitespace-pre-line">{quotation.notes}</p>
        </div>
      )}

      {/* Comments Thread */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-role-accent" />
          <h4 className="font-bold text-foreground text-sm">Notes & Discussion</h4>
          <span className="text-xs text-muted-foreground">({comments.length})</span>
        </div>
        <div className="p-5 space-y-4 max-h-72 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No comments yet. Start the discussion below.</p>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black text-foreground shrink-0">{c.user?.name?.charAt(0) || '?'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{c.user?.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize bg-secondary px-1.5 py-0.5 rounded-full">{c.user?.role}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground bg-secondary/30 rounded-lg px-3 py-2 border border-border leading-snug">{c.comment}</p>
              </div>
            </div>
          ))}
          <div ref={commentEndRef} />
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <input
            type="text"
            placeholder="Add a note..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-role-accent transition-all"
          />
          <button
            onClick={handlePostComment}
            disabled={postingComment || !commentText.trim()}
            className="inline-flex items-center bg-role-primary text-role-primary-foreground font-bold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            {postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
