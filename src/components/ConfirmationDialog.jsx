'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

/**
 * ConfirmationDialog - Modal dialog for confirmations and alerts
 * Supports different types: confirm, alert, warning, danger, success
 */
export default function ConfirmationDialog({
  isOpen = false,
  title = 'Confirm',
  message = 'Are you sure?',
  type = 'confirm', // 'confirm', 'alert', 'warning', 'danger', 'success'
  onConfirm = () => {},
  onCancel = () => {},
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  autoClose = false,
  autoCloseDelay = 2000,
}) {
  const [shouldClose, setShouldClose] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (autoClose && isOpen) {
      timeoutRef.current = setTimeout(() => {
        setShouldClose(true);
        onConfirm();
      }, autoCloseDelay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, autoClose, autoCloseDelay, onConfirm]);

  if (!isOpen || shouldClose) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
      case 'alert':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <Info className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    setShouldClose(true);
  };

  const handleCancel = () => {
    onCancel();
    setShouldClose(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div 
          className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          role="alertdialog"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-border">
            <div className="mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h2 id="dialog-title" className="text-lg font-bold text-foreground">
                {title}
              </h2>
              <p id="dialog-description" className="text-sm text-muted-foreground mt-1">
                {message}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 justify-end">
            {type !== 'success' && (
              <button
                onClick={handleCancel}
                disabled={confirmLoading}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={confirmLoading}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
            >
              {confirmLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Loading...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
