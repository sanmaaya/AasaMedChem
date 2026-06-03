'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Minus, UploadCloud } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * StockHistoryLog - Modal showing stock change history
 * Displays all stock adjustments with reasons and user info
 */
export default function StockHistoryLog({
  isOpen = false,
  productName = 'Product',
  history = [],
  onClose = () => {},
  loading = false,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const getChangeIcon = (reason) => {
    switch (reason) {
      case 'MANUAL_EDIT':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'QUOTATION_ALLOCATE':
        return <Minus className="h-4 w-4 text-amber-500" />;
      case 'CSV_IMPORT':
        return <UploadCloud className="h-4 w-4 text-emerald-500" />;
      default:
        return <Plus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeLabel = (reason) => {
    switch (reason) {
      case 'MANUAL_EDIT':
        return 'Manual Edit';
      case 'QUOTATION_ALLOCATE':
        return 'Quotation Allocated';
      case 'CSV_IMPORT':
        return 'CSV Import';
      default:
        return reason;
    }
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/40">
            <div>
              <h2 className="text-lg font-bold text-foreground">{productName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Stock change history</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition"
            >
              <ChevronDown className="h-5 w-5 rotate-180" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground">Loading history...</p>
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">
                No stock changes recorded yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="p-4 hover:bg-secondary/30 transition cursor-pointer"
                    onClick={() => setExpandedId(expandedId === index ? null : index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-secondary mt-0.5">
                          {getChangeIcon(entry.changeReason)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {getChangeLabel(entry.changeReason)}
                            </span>
                            <span className={`text-xs font-bold ${getChangeColor(entry.change)}`}>
                              {entry.change > 0 ? '+' : ''}{entry.change} units
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>Old: {entry.oldStock}</span>
                            <span>→</span>
                            <span>New: {entry.newStock}</span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.userName} • {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {entry.details && (
                        <button
                          className="text-muted-foreground hover:text-foreground transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(expandedId === index ? null : index);
                          }}
                        >
                          <ChevronDown className={`h-4 w-4 transition ${expandedId === index ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {expandedId === index && entry.details && (
                      <div className="mt-3 pl-11 pt-3 border-t border-border/50 space-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Details:</span>
                          <p className="text-foreground mt-1 break-words">{entry.details}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-secondary/20 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
