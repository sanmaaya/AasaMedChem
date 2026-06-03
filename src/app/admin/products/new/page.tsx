'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [baseUnit, setBaseUnit] = useState('g');
  const [basePricePerUnit, setBasePricePerUnit] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

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
      setLoading(true);
      setError('');

      const res = await fetch('/api/products', {
        method: 'POST',
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while saving the product.');
      setLoading(false);
    }
  };

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
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Product SKU</h2>
        <p className="text-sm text-slate-500 mt-1">Add a new compound or consumable item to the system. Set the unit type and base price.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-750 border border-red-200 rounded-xl p-4 text-sm font-semibold">
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
              placeholder="e.g. Paracetamol Compounding Granules"
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
              placeholder="e.g. PARA-GRAN-250"
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
              placeholder="e.g. Antibiotics, Solvents"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          {/* Base Unit Selection */}
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
            <label className="text-xs font-bold text-slate-400 block mb-1.5">
              PRICE PER BASE UNIT (INR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="any"
              min="0"
              placeholder={`e.g. 0.05 (for ₹0.05 per ${baseUnit})`}
              value={basePricePerUnit}
              onChange={(e) => setBasePricePerUnit(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>

          {/* Initial Stock Quantity */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">
              INITIAL STOCK IN BASE UNIT <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="any"
              min="0"
              placeholder={`e.g. 10000 (for 10,000 ${baseUnit})`}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
            <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
              Always enter quantity in the base unit dimension (i.e., write grams instead of kg, mL instead of L).
            </span>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 block mb-1.5">DESCRIPTION</label>
            <textarea
              placeholder="Provide information about storage conditions, chemical grading, usage, safety protocols, etc."
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2 bg-slate-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-500 transition-all"
            />
          </div>
        </div>

        {/* Form Submission */}
        <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-lg shadow-sm text-sm transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Product SKU
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
