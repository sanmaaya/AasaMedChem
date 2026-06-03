'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Info } from 'lucide-react';

/**
 * ChartWrapper - Reusable wrapper for Recharts charts
 * Provides consistent styling, loading state, and export functionality
 */
export default function ChartWrapper({
  title = 'Chart',
  description = '',
  children,
  loading = false,
  onExport = null,
  height = 'h-80',
  showInfo = false,
  infoText = '',
  className = '',
}) {
  return (
    <motion.div 
      className={`bg-card border border-border rounded-lg p-6 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showInfo && infoText && (
            <button
              title={infoText}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition"
              title="Export chart"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Container */}
      {loading ? (
        <div className={`${height} bg-secondary rounded animate-pulse flex items-center justify-center`}>
          <div className="text-center">
            <div className="inline-block h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      ) : (
        <div className={`${height} w-full overflow-x-auto`}>
          {children}
        </div>
      )}
    </motion.div>
  );
}
