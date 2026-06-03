'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard.jsx';
import { Search, ShoppingCart, RefreshCw, Filter, Layers } from 'lucide-react';

export default function BuyerProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartCount, setCartCount] = useState(0);

  // Sync floating cart badge count from localStorage
  const updateCartCount = () => {
    try {
      const cartData = localStorage.getItem('aasa_buyer_cart') || '[]';
      const items = JSON.parse(cartData);
      // Count unique products
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
      
      // Filter out deactivated/inactive listings
      // (The API already filters inactive for non-admins, but let's be double safe)
      const activeProducts = data.filter(p => p.isActive);
      setProducts(activeProducts);

      if (categories.length === 0) {
        const uniqueCategories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))];
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
    // Watch for cart updates in other tabs/components
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const handleAddToCart = (item) => {
    try {
      const cartData = localStorage.getItem('aasa_buyer_cart') || '[]';
      const cart = JSON.parse(cartData);
      
      const existingIndex = cart.findIndex(c => c.productId === item.productId);
      if (existingIndex > -1) {
        // Replace with new quantity and settings
        cart[existingIndex] = item;
      } else {
        cart.push(item);
      }
      
      localStorage.setItem('aasa_buyer_cart', JSON.stringify(cart));
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
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="h-7 w-7 text-role-accent" />
            Browse Compounds & Catalogues
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse compounds listed by certified sellers. Add items to your cart, and check out directly.
          </p>
        </div>
        <Link
          href="/buyer/cart"
          className="inline-flex items-center justify-center bg-role-primary hover:bg-role-primary/90 text-role-primary-foreground font-bold px-4 py-2.5 rounded-lg shadow-md transition text-sm cursor-pointer"
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Checkout Cart ({cartCount})
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search products by name, category, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-lg pl-10 pr-4 py-2.5 bg-secondary/35 text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
          />
        </div>

        {/* Category filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-secondary/35 text-foreground font-bold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
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
          className="p-2.5 border border-border hover:bg-secondary rounded-lg text-muted-foreground transition cursor-pointer"
          title="Refresh catalog list"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-bold text-foreground text-lg">No Products Available</h3>
          <p className="text-muted-foreground text-xs mt-1">There are no active catalog items that match your search filters.</p>
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

      {/* Floating cart shortcut (Highly premium UI) */}
      {cartCount > 0 && (
        <Link
          href="/buyer/cart"
          className="fixed bottom-6 right-6 z-50 bg-role-primary hover:bg-role-primary/90 text-role-primary-foreground flex items-center space-x-3 px-5 py-3.5 rounded-full shadow-xl hover:scale-105 transition-all duration-200 border border-role-primary font-bold text-sm"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Active Cart: {cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
        </Link>
      )}
    </div>
  );
}
