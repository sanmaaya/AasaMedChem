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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">Link Buyer Account</h3>
          <p className="text-xs text-slate-400">All quotations must be linked to a specific buyer</p>
        </div>
      </div>

      {loading ? (
        <div className="h-10 w-full bg-slate-50 border border-slate-200 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400 font-medium">
          Loading active buyers...
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedBuyerId || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full text-sm border rounded-lg px-3 py-2.5 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
              selectedBuyerId 
                ? 'border-emerald-300 ring-2 ring-emerald-50/50' 
                : 'border-slate-200'
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
            <div className="flex items-start bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3.5 text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2.5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Buyer selection required!</strong>
                <p className="text-amber-700 text-xs mt-0.5">
                  You must link this quotation to a buyer. The "Submit Quotation" button will remain disabled until a selection is made.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs font-semibold">
              <Check className="h-4 w-4 text-emerald-600 mr-2" />
              Quotation will be built for: {buyers.find(b => b.id === selectedBuyerId)?.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
