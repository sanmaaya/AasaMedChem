'use client';

import React from 'react';

/**
 * SkeletonLoader - Reusable skeleton loading UI component
 * Used to show loading state while data is fetching
 */
export function SkeletonLoader({ 
  count = 3, 
  height = 'h-6', 
  className = '',
  type = 'line' // 'line', 'card', 'chart', 'table'
}) {
  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-secondary rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-4 bg-secondary rounded w-full" />
              <div className="h-4 bg-secondary rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/4" />
          <div className="h-64 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
        <div className="animate-pulse p-6 space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-secondary rounded w-full" />
              <div className="h-10 bg-secondary rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: line skeleton
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`${height} bg-secondary rounded animate-pulse`}
        />
      ))}
    </div>
  );
}

export default SkeletonLoader;
