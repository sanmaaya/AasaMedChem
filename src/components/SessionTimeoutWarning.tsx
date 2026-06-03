'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Clock } from 'lucide-react';

/**
 * SessionTimeoutWarning - Modal warning before session expires
 * Shows countdown timer and options to extend or logout
 */
export default function SessionTimeoutWarning({
  isOpen = false,
  timeoutMinutes = 15,
  warningMinutes = 2,
  onExtend = async () => {},
  onLogout = () => {},
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(warningMinutes * 60);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const handleExtend = async () => {
    setIsExtending(true);
    await onExtend();
    setIsExtending(false);
    // Reset timer
    setSecondsRemaining(warningMinutes * 60);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto border border-border animate-in zoom-in-95 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-white flex-shrink-0 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Session Timeout Warning</h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-foreground text-sm leading-relaxed">
              Your session is about to expire due to inactivity. You will be automatically logged out in:
            </p>

            {/* Timer */}
            <div className="text-center py-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border-2 border-dashed border-amber-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  Time Remaining
                </span>
              </div>
              <div className="text-4xl font-bold text-amber-600 font-mono">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>

            {/* Info */}
            <div className="bg-secondary/40 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Click "Extend Session" to continue working without interruption.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border bg-secondary/20 px-6 py-4 flex gap-3">
            <button
              onClick={onLogout}
              disabled={isExtending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold hover:bg-destructive/5 transition disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Logout Now
            </button>
            <button
              onClick={handleExtend}
              disabled={isExtending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-role-primary text-role-primary-foreground font-semibold hover:bg-role-primary/90 transition disabled:opacity-50"
            >
              {isExtending ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  ⏱️
                  Extend Session
                </>
              )}
            </button>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3 bg-secondary/10 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Your session will last <strong>{timeoutMinutes} minutes</strong> from the last action.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
