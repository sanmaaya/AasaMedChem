'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, User, Briefcase, Calendar,
  AlertCircle, Check, X, FileSpreadsheet, Send,
  Printer, Package, Truck, MapPin, CheckCircle2, MessageSquare
} from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units';
import { useToast } from '@/components/ToastProvider';

const ORDER_STEPS = ['pending', 'packed', 'dispatched', 'delivered'];
const STEP_ICONS  = [Package, Package, Truck, CheckCircle2];
const STEP_LABELS = ['Pending', 'Packed', 'Dispatched', 'Delivered'];

export default function AdminQuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const toast = useToast();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const commentEndRef = useRef(null);

  const fetchQuotationDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed');
      const list = await res.json();
      const quote = list.find(q => q.id === id);
      if (!quote) toast.error('Quotation not found.');
      else setQuotation(quote);
    } catch {
      toast.error('Error loading quotation details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/quotations/${id}/comments`);
      if (res.ok) setComments(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (id) { fetchQuotationDetails(); fetchComments(); }
  }, [id]);

  useEffect(() => { commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const handleStatusChange = async (newStatus) => {
    const msg = newStatus === 'approved'
      ? 'APPROVE this quotation? Stock will be decremented immediately.'
      : 'REJECT this quotation?';
    if (!confirm(msg)) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Quotation ${newStatus} successfully!`);
      await fetchQuotationDetails();
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderStatusChange = async (newOrderStatus) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newOrderStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Order status updated to "${newOrderStatus}"`);
      await fetchQuotationDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
    };
    return map[status] || 'bg-secondary text-muted-foreground border-border';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 text-role-accent animate-spin mb-4" />
      <p className="text-muted-foreground font-medium text-sm">Loading quotation profile...</p>
    </div>
  );

  if (!quotation) return (
    <div className="space-y-4">
      <Link href="/admin/quotations" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Link>
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm font-semibold">Quotation not found.</div>
    </div>
  );

  const currentStepIdx = ORDER_STEPS.indexOf(quotation.orderStatus || 'pending');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Link href="/admin/quotations" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Quotations
        </Link>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">{new Date(quotation.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
          <Link
            href={`/admin/quotations/${id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-role-primary text-role-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          >
            <Printer className="h-3.5 w-3.5" /> Print Invoice
          </Link>
        </div>
      </div>

      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 border border-border rounded-xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-muted-foreground font-mono">QUOTATION ID: #{quotation.id.toUpperCase()}</span>
          <h2 className="text-2xl font-black text-foreground tracking-tight mt-1">Review Request</h2>
        </div>
        <span className={`text-xs font-black uppercase px-3.5 py-1 rounded-full border ${getStatusBadge(quotation.status)}`}>{quotation.status}</span>
      </div>

      {/* Order Status Stepper (for approved quotations) */}
      {quotation.status === 'approved' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-5">Order Tracking</h4>
          <div className="flex items-start justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            {ORDER_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i];
              const isCompleted = i <= currentStepIdx;
              const isCurrent   = i === currentStepIdx;
              return (
                <div key={step} className="flex flex-col items-center gap-2 z-10 flex-1">
                  <button
                    disabled={actionLoading || i <= currentStepIdx}
                    onClick={() => handleOrderStatusChange(step)}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                      isCompleted
                        ? 'bg-role-primary border-role-primary text-role-primary-foreground'
                        : 'bg-card border-border text-muted-foreground hover:border-role-primary hover:text-role-primary'
                    }`}
                    title={i <= currentStepIdx ? `Already at "${step}"` : `Advance to "${step}"`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                  <span className={`text-[10px] font-bold text-center ${isCurrent ? 'text-role-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {STEP_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seller & Buyer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { title: 'Created By (Seller Agent)', sub: 'Intermediary Details', icon: <Briefcase className="h-5 w-5" />, color: 'bg-blue-500/10 text-blue-600', data: quotation.seller },
          { title: 'Prepared For (Buyer Customer)', sub: 'Target Account', icon: <User className="h-5 w-5" />, color: 'bg-emerald-500/10 text-emerald-600', data: quotation.buyer },
        ].map((info, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${info.color}`}>{info.icon}</div>
              <div>
                <h3 className="font-bold text-foreground text-sm">{info.title}</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">{info.sub}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Name:</span><strong className="text-foreground">{info.data?.name}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Email:</span><strong className="text-foreground">{info.data?.email}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Line Items Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="p-4 bg-secondary/40 border-b border-border flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-bold text-foreground text-sm">Quotation Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-5">Product</th>
                <th className="py-3 px-5">Ordered Qty</th>
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

      {/* Notes */}
      {quotation.notes && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quotation Notes / Terms</h4>
          <p className="text-sm text-foreground font-medium bg-secondary/25 p-3 rounded-lg border border-border whitespace-pre-line">{quotation.notes}</p>
        </div>
      )}

      {/* Approve / Reject Actions */}
      {quotation.status === 'pending' && (
        <div className="bg-foreground text-background rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
          <div>
            <h4 className="font-bold text-base">Authorize Quotation</h4>
            <p className="text-muted-foreground text-xs mt-0.5">Verify stock levels before confirming. Approval decrements inventory immediately.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-secondary/20 hover:bg-destructive/80 hover:text-white border border-secondary/30 text-background text-sm font-bold rounded-lg transition flex items-center cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" /> Reject
            </button>
            <button
              onClick={() => handleStatusChange('approved')}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-role-accent hover:bg-role-accent/90 text-foreground text-sm font-black rounded-lg transition flex items-center shadow-lg cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Approve & Allocate Stock
            </button>
          </div>
        </div>
      )}

      {/* Comments Thread */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-role-accent" />
          <h4 className="font-bold text-foreground text-sm">Notes & Discussion</h4>
          <span className="text-xs text-muted-foreground">({comments.length})</span>
        </div>
        <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No comments yet. Start the discussion below.</p>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black text-foreground shrink-0">
                {c.user?.name?.charAt(0) || '?'}
              </div>
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
            placeholder="Add a note or question..."
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
