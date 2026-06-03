'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard.jsx';
import { Search, ShoppingCart, RefreshCw, Filter } from 'lucide-react';

export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartCount, setCartCount] = useState(0);

  // Sync floating cart badge count from localStorage
  const updateCartCount = () => {
    try {
      const cartData = localStorage.getItem('aasa_cart') || '[]';
      const items = JSON.parse(cartData);
      setCartCount(items.length);
    } catch (e) {
      console.error(e);
      setCartCount(0);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/products', window.location.origin);
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (selectedCategory) url.searchParams.set('category', selectedCategory);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);

      if (categories.length === 0) {
        const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching products catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    updateCartCount();
    // Watch for cart updates in other components
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const handleAddToCart = (item) => {
    try {
      const cartData = localStorage.getItem('aasa_cart') || '[]';
      const cart = JSON.parse(cartData);
      
      const existingIndex = cart.findIndex(c => c.productId === item.productId);
      if (existingIndex > -1) {
        // Replace with new quantity and settings
        cart[existingIndex] = item;
      } else {
        cart.push(item);
      }
      
      localStorage.setItem('aasa_cart', JSON.stringify(cart));
      updateCartCount();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Products Catalogue</h2>
          <p className="text-sm text-slate-500 mt-1">Browse available pharmaceutical stock, configure ordered quantities, and add items to your active quotation cart.</p>
        </div>
        <Link
          href="/seller/cart"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-md shadow-blue-500/10 text-sm transition cursor-pointer"
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Checkout Cart ({cartCount})
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search products by name, category, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchProducts}
          className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
          title="Refresh catalog list"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <ShoppingCart className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">No Products Available</h3>
          <p className="text-slate-400 text-xs mt-1">There are no active catalog items that match your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => (
            <ProductCard 
              key={prod.id} 
              product={prod} 
              onAddToCart={handleAddToCart} 
            />
          ))}
        </div>
      )}

      {/* Floating cart floating shortcut (Highly premium UI) */}
      {cartCount > 0 && (
        <Link
          href="/seller/cart"
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-3 px-5 py-3.5 rounded-full shadow-xl hover:scale-105 transition-all duration-200 border border-blue-500 font-bold text-sm"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Active Cart: {cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
        </Link>
      )}
    </div>
  );
}
