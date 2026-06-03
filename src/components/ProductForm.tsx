'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/units';

/**
 * ProductForm - Comprehensive form for product creation and editing
 * Includes image upload, category selection, variant builder
 */
export default function ProductForm({
  product = null,
  categories = [],
  onSubmit = async () => {},
  onCancel = () => {},
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    baseUnit: product?.baseUnit || 'unit',
    basePricePerUnit: product?.basePricePerUnit ? parseFloat(product.basePricePerUnit) : 0,
    stockQuantity: product?.stockQuantity ? parseFloat(product.stockQuantity) : 0,
    lowStockThreshold: product?.lowStockThreshold ? parseFloat(product.lowStockThreshold) : 10,
    imageUrl: product?.imageUrl || '',
  });

  const [imagePreview, setImagePreview] = useState(product?.imageUrl || '');
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['basePricePerUnit', 'stockQuantity', 'lowStockThreshold'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result;
        setImagePreview(base64String);
        setFormData(prev => ({
          ...prev,
          imageUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (formData.basePricePerUnit <= 0) newErrors.basePricePerUnit = 'Price must be greater than 0';
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock cannot be negative';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Image Upload */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground block">Product Image</label>
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-role-accent transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF (max 5MB)</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Product Name */}
      <div>
        <label className="text-sm font-bold text-foreground block mb-2">Product Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Aspirin 500mg Tablets"
          className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-bold text-foreground block mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Product details, specifications, etc."
          rows={4}
          className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
        />
      </div>

      {/* SKU and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-foreground block mb-2">SKU *</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            placeholder="e.g., ASP-500-TAB"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
          />
          {errors.sku && <p className="text-xs text-destructive mt-1">{errors.sku}</p>}
        </div>

        <div>
          <label className="text-sm font-bold text-foreground block mb-2">Category *</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId}</p>}
        </div>
      </div>

      {/* Base Unit and Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-foreground block mb-2">Base Unit</label>
          <select
            name="baseUnit"
            value={formData.baseUnit}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
          >
            <option value="unit">Unit</option>
            <option value="g">Gram (g)</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="mL">Milliliter (mL)</option>
            <option value="L">Liter (L)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-foreground block mb-2">Price per Unit ({formData.baseUnit}) *</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">₹</span>
            <input
              type="number"
              name="basePricePerUnit"
              value={formData.basePricePerUnit}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
            />
          </div>
          {errors.basePricePerUnit && <p className="text-xs text-destructive mt-1">{errors.basePricePerUnit}</p>}
        </div>
      </div>

      {/* Stock and Low Stock Threshold */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-foreground block mb-2">Stock Quantity ({formData.baseUnit})</label>
          <input
            type="number"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleInputChange}
            placeholder="0"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
          />
          {errors.stockQuantity && <p className="text-xs text-destructive mt-1">{errors.stockQuantity}</p>}
        </div>

        <div>
          <label className="text-sm font-bold text-foreground block mb-2">Low Stock Alert ({formData.baseUnit})</label>
          <input
            type="number"
            name="lowStockThreshold"
            value={formData.lowStockThreshold}
            onChange={handleInputChange}
            placeholder="10"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 bg-background text-foreground transition"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-2.5 rounded-lg bg-role-primary text-role-primary-foreground font-semibold hover:bg-role-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Saving...
            </>
          ) : (
            `${product ? 'Update' : 'Create'} Product`
          )}
        </button>
      </div>
    </form>
  );
}
