import { Decimal } from 'decimal.js';

// Set decimal precision high enough for our numeric(20,6) fields
Decimal.set({ precision: 20 });

export const UNIT_DIMENSIONS = {
  g:    { dimension: 'weight',  toBase: 1,    label: 'gram (g)',       display: 'g' },
  kg:   { dimension: 'weight',  toBase: 1000, label: 'kilogram (kg)',  display: 'kg' },
  mL:   { dimension: 'volume',  toBase: 1,    label: 'milliliter (mL)',display: 'mL' },
  L:    { dimension: 'volume',  toBase: 1000, label: 'liter (L)',      display: 'L' },
  unit: { dimension: 'count',   toBase: 1,    label: 'unit (pcs)',     display: 'unit' },
};

/**
 * Converts a quantity from a display unit (like kg or L) to its base unit (g or mL).
 * @param {number|string} quantity - The input quantity
 * @param {string} fromUnit - The display unit (g, kg, mL, L, unit)
 * @returns {number} The quantity in base unit
 */
export function toBaseQuantity(quantity, fromUnit) {
  if (quantity === undefined || quantity === null || quantity === '') return 0;
  const factor = UNIT_DIMENSIONS[fromUnit]?.toBase || 1;
  return new Decimal(quantity).mul(factor).toNumber();
}

/**
 * Converts a base unit quantity (grams or milliliters) back to display unit (kg, L, etc.).
 * @param {number|string} baseQuantity - The base quantity
 * @param {string} toUnit - The target display unit
 * @returns {number} The converted display quantity
 */
export function toDisplayQuantity(baseQuantity, toUnit) {
  if (baseQuantity === undefined || baseQuantity === null || baseQuantity === '') return 0;
  const factor = UNIT_DIMENSIONS[toUnit]?.toBase || 1;
  return new Decimal(baseQuantity).div(factor).toNumber();
}

/**
 * Calculates the unit price for a given ordered display unit based on the base price.
 * Example: base price is 0.05 INR/g. For unit 'kg', price is 0.05 * 1000 = 50 INR/kg.
 * @param {number|string} basePricePerBaseUnit - The price per base unit
 * @param {string} orderedUnit - The selected display unit
 * @returns {number} The price per ordered unit
 */
export function getPricePerOrderedUnit(basePricePerBaseUnit, orderedUnit) {
  if (basePricePerBaseUnit === undefined || basePricePerBaseUnit === null || basePricePerBaseUnit === '') return 0;
  const factor = UNIT_DIMENSIONS[orderedUnit]?.toBase || 1;
  return new Decimal(basePricePerBaseUnit).mul(factor).toNumber();
}

/**
 * Returns a list of compatible units for a given base unit.
 * @param {string} baseUnit - The base unit ('g', 'mL', or 'unit')
 * @returns {string[]} An array of compatible unit keys
 */
export function getCompatibleUnits(baseUnit) {
  const dimension = UNIT_DIMENSIONS[baseUnit]?.dimension;
  if (!dimension) return [];
  return Object.keys(UNIT_DIMENSIONS).filter(
    unit => UNIT_DIMENSIONS[unit].dimension === dimension
  );
}

/**
 * Formats a value as INR (₹) currency.
 * Automatically displays up to 6 decimal places for fractional values below standard cents
 * (e.g. ₹0.050000) and exactly 2 decimal places for whole or standard cent amounts.
 * @param {number|string} value - The numerical value to format
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value) {
  const val = Number(value || 0);
  // Check if there are fractions smaller than 0.01
  const hasSubCents = val % 0.01 !== 0;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: hasSubCents ? 6 : 2,
  }).format(val);
}

/**
 * Human-readable unit names (e.g., "per kg", "per unit")
 * @param {string} unit 
 * @returns {string}
 */
export function getUnitLabel(unit) {
  switch (unit) {
    case 'g': return 'g';
    case 'kg': return 'kg';
    case 'mL': return 'mL';
    case 'L': return 'L';
    case 'unit': return 'unit';
    default: return unit;
  }
}
