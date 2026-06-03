'use client';

import React, { useState } from 'react';
import { 
  getCompatibleUnits, 
  getPricePerOrderedUnit, 
  formatCurrency, 
  getUnitLabel,
  toDisplayQuantity
} from '@/lib/units.js';
import { ShoppingCart, Check, Info } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  const { id, name, sku, category, description, baseUnit, basePricePerUnit, stockQuantity } = product;
  
  // Available compatible units
  const compatibleUnits = getCompatibleUnits(baseUnit);
  
  // Selection states for adding to cart
  const [selectedUnit, setSelectedUnit] = useState(compatibleUnits[0] || baseUnit);
  const [quantity, setQuantity] = useState('1');
  const [added, setAdded] = useState(false);

  // Parse numeric values safely
  const numericPrice = parseFloat(basePricePerUnit);
  const numericStock = parseFloat(stockQuantity);

  // Calculations for display prices in all compatible units
  const getUnitPricesString = () => {
    return compatibleUnits.map(unit => {
      const price = getPricePerOrderedUnit(numericPrice, unit);
      return `${formatCurrency(price)} / ${getUnitLabel(unit)}`;
    }).join(' • ');
  };

  // Active pricing calculation
  const activeUnitPrice = getPricePerOrderedUnit(numericPrice, selectedUnit);
  const qty = parseFloat(quantity) || 0;
  const lineTotal = activeUnitPrice * qty;

  // Stock remaining in selected unit
  const displayStock = toDisplayQuantity(numericStock, selectedUnit);

  const handleAdd = () => {
    if (qty <= 0) return;
    
    // Check if adding exceeds available stock
    const baseQuantityAdded = qty * (selectedUnit === 'kg' || selectedUnit === 'L' ? 1000 : 1);
    if (baseQuantityAdded > numericStock) {
      alert(`Warning: You are requesting more stock than available. Available: ${toDisplayQuantity(numericStock, baseUnit)} ${baseUnit}`);
    }

    onAddToCart({
      productId: id,
      name,
      sku,
      category,
      baseUnit,
      basePricePerUnit: numericPrice,
      orderedUnit: selectedUnit,
      orderedQuantity: qty,
      unitPriceAtOrder: activeUnitPrice,
      lineTotal: lineTotal
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs transition-all duration-200 hover:shadow-md hover:border-blue-300">
      <div>
        {/* Category & Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{category || 'Compounding'}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            numericStock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {numericStock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Product Details */}
        <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">{name}</h3>
        <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {sku || 'N/A'}</p>
        
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[2rem]">
          {description || 'No description provided.'}
        </p>

        {/* Compatible Prices Block (Required by spec) */}
        <div className="mt-4 bg-blue-50/50 rounded-lg p-2.5 border border-blue-50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
            <Info className="h-3 w-3 mr-1 text-blue-500" /> Compatible Unit Pricing
          </p>
          <p className="text-xs font-bold text-slate-700">{getUnitPricesString()}</p>
        </div>
      </div>

      {/* Cart Actions Wrapper */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {/* Quantity Input */}
          <div className="col-span-3">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">QTY</label>
            <input
              type="number"
              min="0.000001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
              placeholder="Qty"
            />
          </div>

          {/* Unit Selector */}
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">UNIT</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-1.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            >
              {compatibleUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {getUnitLabel(unit)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Calculation Indicator */}
        <div className="flex items-center justify-between text-xs mb-3 text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span>
            Stock: <strong className="text-slate-700 font-bold">{toDisplayQuantity(numericStock, selectedUnit).toFixed(2)} {selectedUnit}</strong>
          </span>
          <span className="text-right">
            Total: <strong className="text-blue-600 font-black text-sm">{formatCurrency(lineTotal)}</strong>
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={numericStock <= 0 || qty <= 0}
          className={`w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-bold text-white transition-all-custom cursor-pointer ${
            added 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
          } ${numericStock <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''}`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4 mr-2" /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
