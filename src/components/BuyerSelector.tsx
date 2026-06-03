'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Users, Check } from 'lucide-react';

export default function BuyerSelector({ selectedBuyerId, onChange }) {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBuyers() {
      try {
        setLoading(true);
        const res = await fetch('/api/users?role=buyer');
        if (!res.ok) {
          throw new Error('Failed to load buyers list');
        }
        const data = await res.json();
        setBuyers(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error loading buyers. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    fetchBuyers();
  }, []);

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm sm:text-base">Link Buyer Account</h3>
          <p className="text-xs text-muted-foreground">All quotations must be linked to a specific buyer</p>
        </div>
      </div>

      {loading ? (
        <div className="h-10 w-full bg-background border border-border rounded-lg animate-pulse flex items-center justify-center text-xs text-muted-foreground font-medium">
          Loading active buyers...
        </div>
      ) : error ? (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedBuyerId || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full text-sm border rounded-lg px-3 py-2.5 bg-background font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all text-foreground ${
              selectedBuyerId 
                ? 'border-primary/50 ring-2 ring-primary/10' 
                : 'border-border'
            }`}
          >
            <option value="">-- Choose Buyer Account --</option>
            {buyers.map((buyer) => (
              <option key={buyer.id} value={buyer.id}>
                {buyer.name} ({buyer.email})
              </option>
            ))}
          </select>

          {/* Warning banner if no buyer selected */}
          {!selectedBuyerId ? (
            <div className="flex items-start bg-ring/10 border border-ring/20 text-ring rounded-lg p-3.5 text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 text-ring mr-2.5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Buyer selection required!</strong>
                <p className="text-ring/90 text-xs mt-0.5">
                  You must link this quotation to a buyer. The "Submit Quotation" button will remain disabled until a selection is made.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-primary bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-xs font-semibold">
              <Check className="h-4 w-4 text-primary mr-2" />
              Quotation will be built for: {buyers.find(b => b.id === selectedBuyerId)?.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
