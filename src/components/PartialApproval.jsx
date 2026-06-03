'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units.js';

/**
 * PartialApproval - UI for approving/rejecting individual quotation line items
 * Allows selective approval of quotation items
 */
export default function PartialApproval({
  items = [],
  onApproveItem = async () => {},
  onRejectItem = async () => {},
  readOnly = false,
  loading = false,
}) {
  const [approvalStates, setApprovalStates] = useState({});

  const handleApprove = async (itemId) => {
    setApprovalStates(prev => ({ ...prev, [itemId]: 'loading' }));
    await onApproveItem(itemId);
    setApprovalStates(prev => ({ ...prev, [itemId]: 'approved' }));
  };

  const handleReject = async (itemId) => {
    setApprovalStates(prev => ({ ...prev, [itemId]: 'loading' }));
    await onRejectItem(itemId);
    setApprovalStates(prev => ({ ...prev, [itemId]: 'rejected' }));
  };

  const getStatus = (itemId, itemStatus) => {
    return approvalStates[itemId] || itemStatus || 'pending';
  };

  const statusColors = {
    pending: 'border-amber-500/30 bg-amber-500/10',
    approved: 'border-emerald-500/30 bg-emerald-500/10',
    rejected: 'border-destructive/30 bg-destructive/10',
  };

  const statusIcons = {
    pending: <AlertCircle className="h-4 w-4 text-amber-600" />,
    approved: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    rejected: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const statusLabels = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-role-accent" />
          Line Item Approval
        </h3>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const status = getStatus(item.id, item.approvalStatus);
          const isLoading = approvalStates[item.id] === 'loading';
          const canApprove = !readOnly && status === 'pending';

          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition ${statusColors[status]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Product info */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${status === 'approved' ? 'bg-emerald-500/20' : status === 'rejected' ? 'bg-destructive/20' : 'bg-amber-500/20'}`}>
                      {statusIcons[status]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm leading-snug">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        SKU: {item.sku}
                      </p>

                      {/* Quantity and pricing */}
                      <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Quantity</span>
                          <span className="font-bold text-foreground">
                            {item.orderedQuantity} {getUnitLabel(item.orderedUnit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Unit Price</span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Line Total</span>
                          <span className="font-bold text-role-primary text-sm">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    status === 'approved'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                      : status === 'rejected'
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                  }`}>
                    {statusLabels[status]}
                  </span>

                  {canApprove && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={isLoading || loading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {isLoading ? (
                          <>
                            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={isLoading || loading}
                        className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {isLoading ? (
                          <>
                            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs bg-card rounded-lg border border-border">
          No items to approve
        </div>
      )}
    </div>
  );
}
