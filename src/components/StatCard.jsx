'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Equal } from 'lucide-react';

/**
 * StatCard - Animated stat card for displaying key metrics
 * Shows value, label, and optional trend indicator
 */
export default function StatCard({
  icon: Icon,
  label = 'Stat',
  value = '0',
  unit = '',
  trend = 0, // positive = up, negative = down, 0 = neutral
  trendPeriod = 'vs. last month',
  loading = false,
  className = '',
  onClick = null,
}) {
  const getTrendColor = () => {
    if (trend > 0) return 'text-emerald-500';
    if (trend < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4" />;
    return <Equal className="h-4 w-4" />;
  };

  return (
    <motion.div
      className={`bg-card border border-border rounded-lg p-6 cursor-pointer transition hover:border-role-accent ${className}`}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          {loading ? (
            <div className="h-8 bg-secondary rounded animate-pulse w-24" />
          ) : (
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-foreground">{value}</h3>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          )}
          
          {!loading && trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend)}% {trendPeriod}</span>
            </div>
          )}
        </div>

        {Icon && (
          <motion.div 
            className="p-3 rounded-lg bg-role-accent-light/50 text-role-accent"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="h-6 w-6" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
