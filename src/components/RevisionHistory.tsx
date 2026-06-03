'use client';

import React, { useState } from 'react';
import { ChevronDown, User, Edit2, CheckCircle2 } from 'lucide-react';

/**
 * RevisionHistory - Timeline showing all quotation revisions and changes
 * Displays who changed what and when
 */
export default function RevisionHistory({
  revisions = [],
  loading = false,
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <Edit2 className="h-4 w-4 text-blue-500" />;
      case 'updated':
        return <Edit2 className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <CheckCircle2 className="h-4 w-4 text-destructive rotate-180" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return action;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
          <Edit2 className="h-5 w-5 text-role-accent" />
          Revision History
        </h3>
        <p className="text-xs text-muted-foreground">Track all changes made to this quotation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block h-6 w-6 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Loading revisions...</p>
          </div>
        </div>
      ) : revisions.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-lg border border-border text-muted-foreground text-xs">
          No revisions recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {revisions.map((revision, index) => (
            <div key={revision.id || index} className="relative">
              {/* Timeline connector */}
              {index < revisions.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
              )}

              {/* Revision item */}
              <div
                className="bg-card border border-border rounded-lg p-4 hover:border-role-accent transition cursor-pointer"
                onClick={() => setExpandedId(expandedId === index ? null : index)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-secondary mt-0.5 relative z-10">
                    {getActionIcon(revision.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {getActionLabel(revision.action)}
                      </span>
                      {revision.status && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          revision.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : revision.status === 'rejected'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-role-accent-light text-role-accent'
                        }`}>
                          {revision.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{revision.userName || 'System'}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(revision.timestamp).toLocaleString()}</span>
                    </div>

                    {revision.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {revision.notes}
                      </p>
                    )}
                  </div>

                  {/* Expand button */}
                  {(revision.notes || revision.details) && (
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition shrink-0 ${
                        expandedId === index ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>

                {/* Expanded details */}
                {expandedId === index && (revision.notes || revision.details) && (
                  <div className="mt-4 pl-12 pt-3 border-t border-border/50 space-y-2 text-xs">
                    {revision.notes && (
                      <div>
                        <span className="font-bold text-foreground block mb-1">Notes:</span>
                        <p className="text-muted-foreground break-words whitespace-pre-wrap">
                          {revision.notes}
                        </p>
                      </div>
                    )}
                    {revision.details && (
                      <div>
                        <span className="font-bold text-foreground block mb-1">Details:</span>
                        <pre className="text-muted-foreground overflow-x-auto bg-secondary/30 p-2 rounded border border-border/50 text-[10px]">
                          {JSON.stringify(revision.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
