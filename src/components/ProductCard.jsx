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
  const { id, name, sku, category, description, baseUnit, basePricePerUnit, stockQuantity, seller } = product;
  
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
      lineTotal: lineTotal,
      sellerId: seller?.id || null,
      sellerName: seller?.name || 'System'
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col justify-between shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/50">
      <div>
        {/* Category & Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{category || 'Compounding'}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            numericStock > 0 
              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {numericStock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {seller && (
          <div className="text-[10px] text-muted-foreground mb-2 font-medium">
            Sold by: <span className="text-foreground font-bold">{seller.name}</span>
          </div>
        )}

        {/* Product Details */}
        <h3 className="font-bold text-foreground text-base leading-snug line-clamp-1">{name}</h3>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {sku || 'N/A'}</p>
        
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[2rem]">
          {description || 'No description provided.'}
        </p>

        {/* Compatible Prices Block (Required by spec) */}
        <div className="mt-4 bg-secondary/45 rounded-lg p-2.5 border border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center">
            <Info className="h-3 w-3 mr-1 text-primary" /> Compatible Unit Pricing
          </p>
          <p className="text-xs font-bold text-foreground">{getUnitPricesString()}</p>
        </div>
      </div>

      {/* Cart Actions Wrapper */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {/* Quantity Input */}
          <div className="col-span-3">
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">QTY</label>
            <input
              type="number"
              min="0.000001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-primary/40 bg-background font-medium text-foreground"
              placeholder="Qty"
            />
          </div>

          {/* Unit Selector */}
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground block mb-1">UNIT</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-1.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-primary/40 bg-background font-medium text-foreground"
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
        <div className="flex items-center justify-between text-xs mb-3 text-muted-foreground bg-secondary/45 p-2 rounded-lg border border-border">
          <span>
            Stock: <strong className="text-foreground font-bold">{toDisplayQuantity(numericStock, selectedUnit).toFixed(2)} {selectedUnit}</strong>
          </span>
          <span className="text-right">
            Total: <strong className="text-primary font-black text-sm">{formatCurrency(lineTotal)}</strong>
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={numericStock <= 0 || qty <= 0}
          className={`w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-bold text-white transition-all-custom cursor-pointer ${
            added 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
              : 'bg-primary hover:bg-primary/90'
          } ${numericStock <= 0 ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
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
