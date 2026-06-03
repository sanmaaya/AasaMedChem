'use client';

import React from 'react';
import { Inbox, Package, ShoppingCart, FileText, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * EmptyState - Placeholder component for empty lists and sections
 * Shows helpful icon, message, and optional CTA
 */
export default function EmptyState({
  icon = 'inbox', // 'inbox', 'package', 'cart', 'orders', 'users', 'alert', or custom React component
  title = 'Nothing here yet',
  message = 'Get started by creating your first item',
  actionLabel = null,
  actionHref = null,
  onAction = null,
  className = '',
}) {
  const getIcon = () => {
    const iconClass = 'h-12 w-12 text-muted-foreground/40';
    
    switch (icon) {
      case 'package':
        return <Package className={iconClass} />;
      case 'cart':
        return <ShoppingCart className={iconClass} />;
      case 'orders':
        return <FileText className={iconClass} />;
      case 'users':
        return <Users className={iconClass} />;
      case 'alert':
        return <AlertCircle className={iconClass} />;
      case 'inbox':
      default:
        return <Inbox className={iconClass} />;
    }
  };

  if (typeof icon === 'object' && icon.$$typeof) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
        <div className="mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">{message}</p>
        
        {actionLabel && (
          <>
            {actionHref ? (
              <Link
                href={actionHref}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                onClick={onAction}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
              >
                {actionLabel}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{message}</p>
      
      {actionLabel && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
