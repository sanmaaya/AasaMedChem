/**
 * exportUtils.js - Utilities for exporting data to CSV and Excel formats
 * Handles proper encoding, escaping, and formatting for different data types
 */

import { formatCurrency } from './units';

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Optional column configuration
 * @returns {string} CSV content
 */
export function convertToCSV(data, columns = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Determine columns from first object if not provided
  const cols = columns || Object.keys(data[0]);

  // Create header row
  const headerRow = cols.map(col => escapeCSVField(col)).join(',');

  // Create data rows
  const dataRows = data.map(row =>
    cols
      .map(col => {
        let value = row[col];

        // Format special types
        if (value instanceof Date) {
          value = value.toLocaleDateString('en-IN');
        } else if (typeof value === 'number') {
          value = value.toFixed(2);
        } else if (value === null || value === undefined) {
          value = '';
        }

        return escapeCSVField(String(value));
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field values to handle commas, quotes, and newlines
 * @param {string} field - Field value to escape
 * @returns {string} Escaped field value
 */
function escapeCSVField(field) {
  if (typeof field !== 'string') {
    field = String(field);
  }

  // Check if field needs quoting
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/**
 * Generate CSV content and trigger browser download
 * @param {Array} data - Data to export
 * @param {string} filename - Download filename
 * @param {Array} columns - Optional column configuration
 */
export function downloadCSV(data, filename = 'export.csv', columns = null) {
  const csvContent = convertToCSV(data, columns);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Export products data to CSV
 * @param {Array} products - Products array
 */
export function exportProducts(products) {
  const columns = ['name', 'sku', 'category', 'baseUnit', 'price', 'stock', 'lowStockThreshold', 'createdAt'];
  const data = products.map(p => ({
    name: p.name,
    sku: p.sku,
    category: p.categoryName || p.categoryId,
    baseUnit: p.baseUnit,
    price: formatCurrency(p.price),
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    createdAt: new Date(p.createdAt).toLocaleDateString('en-IN'),
  }));

  downloadCSV(data, `products-${Date.now()}.csv`, columns);
}

/**
 * Export quotations data to CSV
 * @param {Array} quotations - Quotations array
 */
export function exportQuotations(quotations) {
  const columns = ['quotationId', 'sellerName', 'buyerName', 'status', 'totalAmount', 'createdAt', 'expiresAt'];
  const data = quotations.map(q => ({
    quotationId: q.id.substring(0, 8).toUpperCase(),
    sellerName: q.sellerName || 'N/A',
    buyerName: q.buyerName || 'N/A',
    status: q.status,
    totalAmount: formatCurrency(q.totalAmount),
    createdAt: new Date(q.createdAt).toLocaleDateString('en-IN'),
    expiresAt: q.expiresAt ? new Date(q.expiresAt).toLocaleDateString('en-IN') : 'N/A',
  }));

  downloadCSV(data, `quotations-${Date.now()}.csv`, columns);
}

/**
 * Export quotation items (line items) to CSV
 * @param {Array} items - Quotation items array
 * @param {string} quotationId - Quotation ID for filename
 */
export function exportQuotationItems(items, quotationId) {
  const columns = ['productName', 'sku', 'quantity', 'unit', 'unitPrice', 'lineTotal'];
  const data = items.map(item => ({
    productName: item.productName,
    sku: item.sku,
    quantity: item.orderedQuantity,
    unit: item.orderedUnit,
    unitPrice: formatCurrency(item.unitPrice),
    lineTotal: formatCurrency(item.lineTotal),
  }));

  downloadCSV(
    data,
    `quotation-items-${quotationId?.substring(0, 8).toUpperCase()}-${Date.now()}.csv`,
    columns
  );
}

/**
 * Export analytics/report data to CSV
 * @param {Array} data - Analytics data
 * @param {string} reportType - Type of report (seller-performance, category-performance, etc.)
 */
export function exportAnalytics(data, reportType) {
  let columns, exportData;

  switch (reportType) {
    case 'seller-performance':
      columns = ['sellerName', 'revenue', 'orders', 'approved', 'conversionRate'];
      exportData = data.map(row => ({
        sellerName: row.sellerName,
        revenue: formatCurrency(row.revenue),
        orders: row.orders,
        approved: row.approved,
        conversionRate: `${(row.conversionRate || 0).toFixed(1)}%`,
      }));
      break;

    case 'category-performance':
      columns = ['categoryName', 'revenue', 'units', 'orders', 'avgOrderValue'];
      exportData = data.map(row => ({
        categoryName: row.categoryName,
        revenue: formatCurrency(row.revenue),
        units: row.units,
        orders: row.orders,
        avgOrderValue: formatCurrency(row.avgOrderValue),
      }));
      break;

    case 'quotation-status':
      columns = ['status', 'count', 'totalAmount'];
      exportData = data.map(row => ({
        status: row.status.toUpperCase(),
        count: row.count,
        totalAmount: formatCurrency(row.totalAmount),
      }));
      break;

    default:
      exportData = data;
      columns = Object.keys(data[0] || {});
  }

  downloadCSV(exportData, `report-${reportType}-${Date.now()}.csv`, columns);
}

/**
 * Convert CSV string to array of objects
 * Note: Simple implementation. Use 'csv-parse' package for production
 * @param {string} csvContent - CSV content as string
 * @returns {Array} Array of objects
 */
export function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    data.push(obj);
  }

  return data;
}

/**
 * Format data for display in tables
 * @param {*} value - Value to format
 * @param {string} type - Data type (currency, date, percentage, etc.)
 * @returns {string} Formatted value
 */
export function formatForDisplay(value, type = 'text') {
  if (value === null || value === undefined) {
    return '-';
  }

  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'date':
      return new Date(value).toLocaleDateString('en-IN');
    case 'datetime':
      return new Date(value).toLocaleString('en-IN');
    case 'percentage':
      return `${Number(value).toFixed(2)}%`;
    case 'number':
      return Number(value).toLocaleString('en-IN');
    default:
      return String(value);
  }
}

/**
 * Create summary statistics from array of objects
 * @param {Array} data - Data array
 * @param {Array} numericFields - Fields to calculate stats for
 * @returns {Object} Summary statistics
 */
export function generateSummary(data, numericFields = []) {
  const summary = {
    count: data.length,
    fields: {},
  };

  numericFields.forEach(field => {
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(v => !isNaN(v));

    if (values.length === 0) return;

    summary.fields[field] = {
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  });

  return summary;
}
