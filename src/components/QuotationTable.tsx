import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/units';
import { FileText, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function QuotationTable({ quotations, role }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-ring/10 text-ring border border-ring/20 uppercase">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground uppercase">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDetailUrl = (id) => {
    return `/${role}/quotations/${id}`;
  };

  if (!quotations || quotations.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-foreground text-base">No Quotations Found</h3>
        <p className="text-muted-foreground text-xs mt-1.5">There are no records matching your account scope.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="py-4 px-6">ID</th>
              {role === 'admin' && <th className="py-4 px-6">Seller</th>}
              {role !== 'buyer' && <th className="py-4 px-6">Buyer</th>}
              {role === 'buyer' && <th className="py-4 px-6">Seller</th>}
              <th className="py-4 px-6">Grand Total</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Date Created</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {quotations.map((quote) => (
              <tr key={quote.id} className="hover:bg-secondary/30 transition-colors">
                <td className="py-4 px-6 font-mono text-xs font-semibold text-muted-foreground">
                  #{quote.id.substring(0, 8).toUpperCase()}
                </td>
                
                {role === 'admin' && (
                  <td className="py-4 px-6">
                    <p className="font-semibold text-foreground">{quote.sellerName || quote.seller?.name}</p>
                    <p className="text-xs text-muted-foreground">{quote.sellerEmail || quote.seller?.email}</p>
                  </td>
                )}
                
                {role !== 'buyer' && (
                  <td className="py-4 px-6">
                    <p className="font-semibold text-foreground">{quote.buyerName || quote.buyer?.name}</p>
                    <p className="text-xs text-muted-foreground">{quote.buyerEmail || quote.buyer?.email}</p>
                  </td>
                )}

                {role === 'buyer' && (
                  <td className="py-4 px-6">
                    <p className="font-semibold text-foreground">{quote.sellerName || quote.seller?.name}</p>
                    <p className="text-xs text-muted-foreground">{quote.sellerEmail || quote.seller?.email}</p>
                  </td>
                )}

                <td className="py-4 px-6 font-bold text-foreground">
                  {formatCurrency(quote.totalAmount)}
                </td>
                
                <td className="py-4 px-6">
                  {getStatusBadge(quote.status)}
                </td>
                
                <td className="py-4 px-6 text-muted-foreground font-medium">
                  {formatDate(quote.createdAt)}
                </td>
                
                <td className="py-4 px-6 text-right">
                  <Link
                    href={getDetailUrl(quote.id)}
                    className="inline-flex items-center text-xs font-bold text-role-primary hover:text-role-accent bg-role-accent-light px-3 py-1.5 rounded-lg transition-all-custom cursor-pointer"
                  >
                    View Details
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
