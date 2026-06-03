'use client';

import React from 'react';
import { Check, Package, Truck, Home } from 'lucide-react';

/**
 * OrderStatusTracker - Visual stepper showing order progress
 * Displays: Pending → Packed → Dispatched → Delivered
 */
export default function OrderStatusTracker({
  status = 'pending', // pending, packed, dispatched, delivered
  onStatusChange = async () => {},
  readOnly = false,
  timestamps = {},
}) {
  const statuses = [
    { id: 'pending', label: 'Pending', icon: Package, color: 'text-amber-600' },
    { id: 'packed', label: 'Packed', icon: Package, color: 'text-blue-600' },
    { id: 'dispatched', label: 'Dispatched', icon: Truck, color: 'text-purple-600' },
    { id: 'delivered', label: 'Delivered', icon: Home, color: 'text-emerald-600' },
  ];

  const currentIndex = statuses.findIndex(s => s.id === status);

  const handleStatusClick = async (newStatus) => {
    if (!readOnly && currentIndex < statuses.indexOf(statuses.find(s => s.id === newStatus))) {
      await onStatusChange(newStatus);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {statuses.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const canClick = !readOnly && index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <button
                onClick={() => handleStatusClick(step.id)}
                disabled={!canClick}
                className={`flex flex-col items-center gap-2 relative z-10 group ${canClick ? 'cursor-pointer' : ''}`}
              >
                <div
                  className={`relative h-12 w-12 rounded-full border-2 flex items-center justify-center transition ${
                    isCompleted
                      ? 'bg-role-primary border-role-primary text-role-primary-foreground'
                      : 'bg-secondary border-border text-muted-foreground group-hover:border-role-primary'
                  }`}
                >
                  {isCompleted && index < currentIndex ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="text-center">
                  <p className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {timestamps[step.id] && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(timestamps[step.id]).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Tooltip for clickable steps */}
                {canClick && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    Click to update
                  </div>
                )}
              </button>

              {/* Connector Line */}
              {index < statuses.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition ${
                    index < currentIndex ? 'bg-role-primary' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status Info */}
      <div className="mt-6 p-4 rounded-lg bg-secondary/40 border border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Status</p>
        <p className="text-sm font-semibold text-foreground">
          {statuses[currentIndex]?.label || 'Unknown'}
        </p>
        {timestamps[status] && (
          <p className="text-xs text-muted-foreground mt-2">
            Updated: {new Date(timestamps[status]).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
