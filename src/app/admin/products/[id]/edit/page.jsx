'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [baseUnit, setBaseUnit] = useState('g');
  const [basePricePerUnit, setBasePricePerUnit] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch product on mount
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products`);
        if (!res.ok) throw new Error('Failed to fetch catalogue');
        const list = await res.json();
        
        // Find product in list
        const product = list.find(p => p.id === id);
        if (!product) {
          setError('Product not found in catalogue.');
          setLoading(false);
          return;
        }

        setName(product.name);
        setSku(product.sku || '');
        setCategory(product.category || '');
        setDescription(product.description || '');
        setBaseUnit(product.baseUnit);
        setBasePricePerUnit(product.basePricePerUnit);
        setStockQuantity(product.stockQuantity);
        setIsActive(product.isActive);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Error loading product details.');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !basePricePerUnit || stockQuantity === '') {
      setError('Please fill in all required fields (Name, Base Price, and Stock Quantity).');
      return;
    }

    const priceNum = parseFloat(basePricePerUnit);
    const stockNum = parseFloat(stockQuantity);

    if (isNaN(priceNum) || priceNum < 0 || isNaN(stockNum) || stockNum < 0) {
      setError('Base price and Stock quantity must be non-negative numbers.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          sku: sku.trim() || null,
          category: category.trim() || null,
          description: description.trim() || null,
          baseUnit,
          basePricePerUnit: priceNum.toString(),
          stockQuantity: stockNum.toString(),
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while updating the product.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Fetching product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back navigation */}
      <Link
        href="/admin/products"
        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition shadow-xs"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Catalog
      </Link>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Edit Product SKU</h2>
        <p className="text-sm text-slate-500 mt-1">Modify inventory values, pricing, and description for this catalogue record.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-755 border border-red-200 rounded-xl p-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 block mb-1.5">PRODUCT NAME <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">SKU CODE (UNIQUE)</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">CATEGORY</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          {/* Base Unit */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">BASE UNIT MEASURE <span className="text-red-500">*</span></label>
            <select
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            >
              <option value="g">Grams (g) - for Weight dimension</option>
              <option value="mL">Milliliters (mL) - for Volume dimension</option>
              <option value="unit">Units (unit) - for Count dimension</option>
            </select>
          </div>

          {/* Base Price per Unit */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">PRICE PER BASE UNIT (INR) <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              step="any"
              min="0"
              value={basePricePerUnit}
              onChange={(e) => setBasePricePerUnit(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">STOCK QUANTITY IN BASE UNIT <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              step="any"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
            <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
              Always enter quantity in the base unit dimension (i.e., grams instead of kg).
            </span>
          </div>

          {/* Is Active Status checkbox */}
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              SKU is Active & Available
            </label>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 block mb-1.5">DESCRIPTION</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-lg shadow-sm text-sm transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Modifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
