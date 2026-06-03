'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  User,
  Package,
  FileText,
  DollarSign,
} from 'lucide-react';

/**
 * ActivityFeed - Shows recent activities/actions in the system
 * Displays timeline of events with icons and timestamps
 */
export default function ActivityFeed({
  activities = [],
  loading = false,
  maxItems = 5,
  className = '',
}) {
  const getIcon = (type) => {
    const iconClass = 'h-4 w-4';
    switch (type) {
      case 'create':
        return <Plus className={iconClass} />;
      case 'edit':
        return <Edit2 className={iconClass} />;
      case 'delete':
        return <Trash2 className={iconClass} />;
      case 'approve':
      case 'success':
        return <CheckCircle2 className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'order':
        return <FileText className={iconClass} />;
      case 'product':
        return <Package className={iconClass} />;
      case 'payment':
        return <DollarSign className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'delete':
        return 'text-destructive bg-destructive/10';
      case 'approve':
      case 'success':
        return 'text-emerald-500 bg-emerald-500/10';
      case 'warning':
        return 'text-amber-500 bg-amber-500/10';
      case 'create':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-muted-foreground bg-secondary';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const actDate = new Date(date);
    const diffMs = now - actDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return actDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-secondary shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-secondary rounded w-32" />
              <div className="h-2 bg-secondary rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={`space-y-3 ${className}`}>
      {displayActivities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No recent activities
        </div>
      ) : (
        displayActivities.map((activity, index) => (
          <motion.div
            key={activity.id || index}
            className="flex gap-3 pb-3 border-b border-border last:border-b-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Icon */}
            <div className={`p-2 rounded-lg shrink-0 ${getColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {activity.user && <span className="font-medium">{activity.user} • </span>}
                {formatTime(activity.timestamp || new Date())}
              </p>
            </div>

            {/* Icon Badge (optional) */}
            {activity.badge && (
              <div className="text-xs font-bold px-2 py-1 rounded-full bg-role-accent-light text-role-accent shrink-0">
                {activity.badge}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}
