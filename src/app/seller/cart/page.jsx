'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BuyerSelector from '@/components/BuyerSelector.jsx';
import CartItem from '@/components/CartItem.jsx';
import { formatCurrency } from '@/lib/units.js';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Trash2, 
  Send, 
  Loader2, 
  AlertCircle, 
  Check 
} from 'lucide-react';

export default function SellerCartPage() {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const cartData = localStorage.getItem('aasa_cart') || '[]';
      setCartItems(JSON.parse(cartData));
      
      const savedBuyerId = localStorage.getItem('aasa_cart_buyer') || '';
      setSelectedBuyerId(savedBuyerId);

      const savedNotes = localStorage.getItem('aasa_cart_notes') || '';
      setNotes(savedNotes);
    } catch (e) {
      console.error('Error loading cart:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync states to localStorage whenever changed
  const saveCartToStorage = (items) => {
    localStorage.setItem('aasa_cart', JSON.stringify(items));
    setCartItems(items);
  };

  const handleBuyerChange = (buyerId) => {
    setSelectedBuyerId(buyerId);
    localStorage.setItem('aasa_cart_buyer', buyerId);
  };

  const handleNotesChange = (text) => {
    setNotes(text);
    localStorage.setItem('aasa_cart_notes', text);
  };

  const handleUpdateItem = (productId, updatedItem) => {
    const updated = cartItems.map(item => 
      item.productId === productId ? updatedItem : item
    );
    saveCartToStorage(updated);
  };

  const handleRemoveItem = (productId) => {
    const updated = cartItems.filter(item => item.productId !== productId);
    saveCartToStorage(updated);
  };

  const handleClearCart = () => {
    if (!confirm('Are you sure you want to empty the active quotation cart?')) return;
    saveCartToStorage([]);
    setSelectedBuyerId('');
    setNotes('');
    localStorage.removeItem('aasa_cart_buyer');
    localStorage.removeItem('aasa_cart_notes');
  };

  // Grand Total Calculation
  const grandTotal = cartItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  const handleSubmitQuotation = async () => {
    if (!selectedBuyerId) {
      setError('Please select a Buyer account first.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Your quotation cart is currently empty. Please add products.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerId: selectedBuyerId,
          notes: notes.trim() || null,
          items: cartItems.map(item => ({
            productId: item.productId,
            orderedUnit: item.orderedUnit,
            orderedQuantity: item.orderedQuantity.toString()
          }))
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quotation request');
      }

      setSuccess('Quotation submitted successfully! Clearing cart...');
      
      // Wipe localStorage cart state
      localStorage.removeItem('aasa_cart');
      localStorage.removeItem('aasa_cart_buyer');
      localStorage.removeItem('aasa_cart_notes');
      setCartItems([]);
      setSelectedBuyerId('');
      setNotes('');

      // Redirect to history list
      setTimeout(() => {
        router.push('/seller/quotations');
        router.refresh();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during submission.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-505 font-medium text-sm">Initializing quotation basket...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/seller/products"
        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition shadow-xs"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Products Catalog
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Active Quotation Builder</h2>
          <p className="text-sm text-slate-500 mt-1">Review selected items, allocate quantities, select the target buyer, and submit for Admin authorization.</p>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="inline-flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-655 font-bold px-3 py-2 rounded-lg text-sm transition cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear Cart
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-750 border border-red-250 rounded-xl p-4 text-sm font-semibold flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Submission Blocked</strong>
            <p className="text-red-750 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-xl p-4 text-sm font-semibold flex items-center">
          <Check className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
          {success}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <ShoppingCart className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">Your Cart is Empty</h3>
          <p className="text-slate-400 text-xs mt-1 mb-6">You haven't added any products to build a quotation yet.</p>
          <Link
            href="/seller/products"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm shadow-md transition cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Buyer Selector (Required at the top) */}
          <BuyerSelector 
            selectedBuyerId={selectedBuyerId} 
            onChange={handleBuyerChange} 
          />

          {/* Cart items list */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-base">Selected Compounds & Items</h3>
            {cartItems.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          {/* Notes area */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <label className="text-xs font-bold text-slate-400 block mb-2">QUOTATION NOTES & SPECIAL TERMS</label>
            <textarea
              placeholder="e.g. Requesting expedited logistics, chemical certificate updates, customized compounding volumes, standard 30-day billing, etc."
              rows="3"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Summary & Submit */}
          <div className="bg-white rounded-xl border border-slate-250 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimated Quotation Value</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(grandTotal)}</p>
            </div>
            
            <button
              onClick={handleSubmitQuotation}
              disabled={submitting || !selectedBuyerId}
              className={`inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow-md transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Submit Quotation to Admin
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
