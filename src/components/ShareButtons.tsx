'use client';

import React, { useState } from 'react';
import { Copy, Mail, MessageCircle, Share2, Loader2 } from 'lucide-react';

/**
 * ShareButtons - Component for sharing quotations via multiple channels
 * Supports: Email, WhatsApp, Copy Link, PDF Download
 */
export default function ShareButtons({
  quotationId,
  quotationTitle = 'Quotation',
  shareUrl,
  onEmail = async () => {},
  onWhatsApp = async () => {},
  onDownloadPDF = async () => {},
  loading = false,
}) {
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleEmail = async () => {
    setLoadingAction('email');
    await onEmail();
    setLoadingAction(null);
  };

  const handleWhatsApp = async () => {
    setLoadingAction('whatsapp');
    await onWhatsApp();
    setLoadingAction(null);
  };

  const handlePDF = async () => {
    setLoadingAction('pdf');
    await onDownloadPDF();
    setLoadingAction(null);
  };

  const shareText = `Check out this quotation: ${quotationTitle}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)} ${encodeURIComponent(shareUrl || '')}`;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Share2 className="h-4 w-4 text-role-accent" />
          Share This Quotation
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Email Share */}
        <button
          onClick={handleEmail}
          disabled={loading || loadingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
        >
          {loadingAction === 'email' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Send Email
            </>
          )}
        </button>

        {/* WhatsApp Share */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 text-sm"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          disabled={!shareUrl || loading}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 text-sm ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-600 text-white hover:bg-slate-700'
          }`}
        >
          <Copy className="h-4 w-4" />
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        {/* PDF Download */}
        <button
          onClick={handlePDF}
          disabled={loading || loadingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition disabled:opacity-50 text-sm"
        >
          {loadingAction === 'pdf' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              📄
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Share URL Display */}
      {shareUrl && (
        <div className="p-3 rounded-lg bg-secondary/40 border border-border">
          <p className="text-xs text-muted-foreground font-bold mb-1">Share Link:</p>
          <p className="text-xs text-foreground break-all font-mono">{shareUrl}</p>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        📧 Email sends a professional formatted message with a link to the quotation.
        <br />
        💬 WhatsApp opens your messaging app with the quotation link.
        <br />
        📄 Download a PDF copy for printing or offline sharing.
      </p>
    </div>
  );
}
