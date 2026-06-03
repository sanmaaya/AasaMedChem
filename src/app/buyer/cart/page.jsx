'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartItem from '@/components/CartItem.jsx';
import { formatCurrency } from '@/lib/units.js';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Trash2, 
  Send, 
  Loader2, 
  AlertCircle, 
  Check,
  Building2
} from 'lucide-react';

export default function BuyerCartPage() {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const cartData = localStorage.getItem('aasa_buyer_cart') || '[]';
      setCartItems(JSON.parse(cartData));
      
      const savedNotes = localStorage.getItem('aasa_buyer_cart_notes') || '';
      setNotes(savedNotes);
    } catch (e) {
      console.error('Error loading cart:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state to localStorage whenever changed
  const saveCartToStorage = (items) => {
    localStorage.setItem('aasa_buyer_cart', JSON.stringify(items));
    setCartItems(items);
  };

  const handleNotesChange = (text) => {
    setNotes(text);
    localStorage.setItem('aasa_buyer_cart_notes', text);
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
    if (!confirm('Are you sure you want to empty your shopping cart?')) return;
    saveCartToStorage([]);
    setNotes('');
    localStorage.removeItem('aasa_buyer_cart_notes');
  };

  // Group cart items by sellerId/sellerName
  const groupedCart = cartItems.reduce((acc, item) => {
    const sId = item.sellerId || 'default-seller';
    const sName = item.sellerName || 'Aasa Authorized Representative';
    
    if (!acc[sId]) {
      acc[sId] = {
        sellerId: sId,
        sellerName: sName,
        items: []
      };
    }
    acc[sId].items.push(item);
    return acc;
  }, {});

  const groupedSellers = Object.values(groupedCart);

  // Grand Total Calculation
  const grandTotal = cartItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  const handleSubmitCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Your shopping cart is empty.');
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
        throw new Error(data.error || 'Failed to checkout cart');
      }

      setSuccess('Checkout complete! Separate quotations created for each seller.');
      
      // Wipe localStorage cart state
      localStorage.removeItem('aasa_buyer_cart');
      localStorage.removeItem('aasa_buyer_cart_notes');
      setCartItems([]);
      setNotes('');

      // Redirect to quotations history list
      setTimeout(() => {
        router.push('/buyer/quotations');
        router.refresh();
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during submission.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-role-accent animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/buyer/products"
        className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition shadow-xs"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Browse
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Your Cart</h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Review your items before submitting a quotation request.
          </p>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="inline-flex items-center justify-center border border-destructive/25 hover:bg-destructive/10 text-destructive font-bold px-3 py-2 rounded-lg text-sm transition cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Empty Cart
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm font-semibold flex items-start">
          <AlertCircle className="h-5 w-5 text-destructive mr-2 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Checkout Failed</strong>
            <p className="text-destructive text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-4 text-sm font-semibold flex items-center">
          <Check className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
          {success}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border shadow-xs">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-bold text-foreground text-lg">Your Cart is Empty</h3>
          <p className="text-muted-foreground text-xs mt-1 mb-6">Explore the catalog to find and add pharmaceutical compounds.</p>
          <Link
            href="/buyer/products"
            className="inline-flex items-center justify-center bg-role-primary hover:bg-role-primary/95 text-role-primary-foreground font-bold px-5 py-2.5 rounded-lg text-sm shadow-md transition cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart items grouped by Seller */}
          <div className="space-y-6">
            {groupedSellers.map((group) => (
              <div key={group.sellerId} className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                {/* Seller Group Header */}
                <div className="bg-secondary/40 border-b border-border px-5 py-3.5 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-role-accent" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Sold by: <strong className="text-foreground font-extrabold">{group.sellerName}</strong>
                  </span>
                </div>
                
                {/* Items List */}
                <div className="p-4 space-y-3.5 bg-card">
                  {group.items.map((item) => (
                    <CartItem
                      key={item.productId}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
                
                {/* Subtotal */}
                <div className="bg-secondary/15 px-5 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Items: {group.items.length}</span>
                  <span>Subtotal: <strong className="text-foreground text-sm font-bold">{formatCurrency(group.items.reduce((sum, it) => sum + (it.lineTotal || 0), 0))}</strong></span>
                </div>
              </div>
            ))}
          </div>



          {/* Notes area */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
            <label className="text-xs font-bold text-muted-foreground block mb-2">ADDITIONAL TERMS OR INSTRUCTIONS FOR THE ORDER</label>
            <textarea
              placeholder="e.g. Requesting expedited logistics, certificate of analysis updates, customized compounding volumes, standard 30-day billing, etc."
              rows="3"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
            />
          </div>

          {/* Summary & Submit */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Grand Total</p>
              <p className="text-2xl font-black text-role-primary mt-1">{formatCurrency(grandTotal)}</p>
            </div>
            
            <button
              onClick={handleSubmitCheckout}
              disabled={submitting}
              className={`inline-flex items-center justify-center bg-role-primary hover:bg-role-primary/95 text-role-primary-foreground font-bold px-6 py-3 rounded-lg shadow-md transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Quotations...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Place Quotation Requests
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
