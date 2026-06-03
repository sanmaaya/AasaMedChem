'use client';

import React from 'react';
import { 
  getCompatibleUnits, 
  getPricePerOrderedUnit, 
  formatCurrency, 
  getUnitLabel
} from '@/lib/units.js';
import { Trash2 } from 'lucide-react';

export default function CartItem({ item, onUpdate, onRemove }) {
  const { productId, name, sku, baseUnit, basePricePerUnit, orderedUnit, orderedQuantity } = item;
  
  // Available compatible units
  const compatibleUnits = getCompatibleUnits(baseUnit);
  
  const handleQuantityChange = (qtyVal) => {
    const qty = parseFloat(qtyVal) || 0;
    const activePrice = getPricePerOrderedUnit(basePricePerUnit, orderedUnit);
    const lineTotal = qty * activePrice;
    
    onUpdate(productId, {
      ...item,
      orderedQuantity: qtyVal, // store as string in input to allow typing decimals
      lineTotal: lineTotal
    });
  };

  const handleUnitChange = (unitVal) => {
    const activePrice = getPricePerOrderedUnit(basePricePerUnit, unitVal);
    const qty = parseFloat(orderedQuantity) || 0;
    const lineTotal = qty * activePrice;

    onUpdate(productId, {
      ...item,
      orderedUnit: unitVal,
      unitPriceAtOrder: activePrice,
      lineTotal: lineTotal
    });
  };

  const numericQuantity = parseFloat(orderedQuantity) || 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200 bg-white rounded-xl p-4 gap-4 hover:border-blue-200 transition-all">
      {/* Product Info */}
      <div className="flex-1 min-w-[200px]">
        <h4 className="font-bold text-slate-800 text-sm sm:text-base">{name}</h4>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-slate-400 font-mono">SKU: {sku || 'N/A'}</span>
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-medium">Base unit: {baseUnit}</span>
        </div>
      </div>

      {/* Inputs (Quantity & Unit) */}
      <div className="flex items-center space-x-3">
        {/* Quantity Input */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Quantity</label>
          <input
            type="number"
            min="0.000001"
            step="any"
            value={orderedQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-24 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-semibold"
          />
        </div>

        {/* Unit Selector */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Unit</label>
          <select
            value={orderedUnit}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="w-20 text-sm border border-slate-200 rounded-lg px-1.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 font-semibold"
          >
            {compatibleUnits.map((unit) => (
              <option key={unit} value={unit}>
                {getUnitLabel(unit)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="flex items-center justify-between sm:justify-end space-x-6 min-w-[160px] border-t sm:border-t-0 pt-3 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-400">
            {formatCurrency(getPricePerOrderedUnit(basePricePerUnit, orderedUnit))} / {getUnitLabel(orderedUnit)}
          </p>
          <p className="text-base font-black text-slate-800 mt-0.5">
            {formatCurrency(item.lineTotal)}
          </p>
        </div>
        <button
          onClick={() => onRemove(productId)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all-custom cursor-pointer"
          title="Remove item"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
