'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units.js';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch products with search and category filters
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

      // Extract unique categories for filter dropdown if not already populated
      if (categories.length === 0) {
        const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input slightly
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will hide the product from the Seller catalog.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to deactivate product');
      }

      // Reload products list
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error deactivating product.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Product Catalogue</h2>
          <p className="text-sm text-slate-500 mt-1">Manage physical inventory, configure base unit dimensions, and edit wholesale pricing.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-lg shadow-sm text-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" /> Add New SKU
        </Link>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50 font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
          />
        </div>

        {/* Category selector */}
        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 font-bold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchProducts}
          className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
          title="Refresh products list"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Products table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Package className="h-14 w-14 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Products Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or add a new SKU item to the catalogue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">SKU / ID</th>
                  <th className="py-4 px-6">Name / Category</th>
                  <th className="py-4 px-6">Base Unit</th>
                  <th className="py-4 px-6">Price (per base unit)</th>
                  <th className="py-4 px-6">Stock Level</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((prod) => {
                  const stock = parseFloat(prod.stockQuantity);
                  const isOutOfStock = stock <= 0;
                  
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-slate-650 bg-slate-100 px-2 py-1 rounded-md">
                          {prod.sku || 'No SKU'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{prod.id.substring(0, 8)}...</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{prod.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{prod.category || 'Compounding material'}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {getUnitLabel(prod.baseUnit)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatCurrency(prod.basePricePerUnit)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-bold ${isOutOfStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {stock.toFixed(2)} {prod.baseUnit}
                        </span>
                        {isOutOfStock && (
                          <span className="ml-2 inline-flex items-center text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> Empty
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {prod.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                            <Check className="h-3 w-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-550 text-slate-600 border border-slate-200 uppercase">
                            <X className="h-3 w-3 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/products/${prod.id}/edit`}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                            title="Edit product info"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          {prod.isActive && (
                            <button
                              onClick={() => handleDeactivate(prod.id, prod.name)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                              title="Deactivate SKU"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
