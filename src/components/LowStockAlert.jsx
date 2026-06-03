'use client';

import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';

/**
 * LowStockAlert - Badge component for products with low stock
 * Shows warning indicator when stock is below threshold
 */
export default function LowStockAlert({
  stock = 0,
  threshold = 10,
  unit = 'units',
  severity = 'warning', // 'warning', 'danger'
  showDetails = false,
  className = '',
}) {
  const isLowStock = stock <= threshold;
  const isCritical = stock === 0;

  if (!isLowStock && !showDetails) return null;

  const severityClass = isCritical 
    ? 'bg-destructive/10 border-destructive/30 text-destructive'
    : severity === 'danger'
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
    : 'bg-amber-500/10 border-amber-500/30 text-amber-600';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-xs ${severityClass} ${className}`}>
      {isCritical ? (
        <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" />
      )}
      <span>
        {isCritical 
          ? 'Out of Stock'
          : `Low Stock (${stock} ${unit})`
        }
      </span>
    </div>
  );
}
