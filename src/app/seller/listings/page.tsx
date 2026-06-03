'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  Loader2,
  Save,
  Info,
  Layers,
  Sparkles,
  ArchiveRestore
} from 'lucide-react';
import { formatCurrency, getUnitLabel } from '@/lib/units';

export default function SellerListingsPage() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentProductId, setCurrentProductId] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [baseUnit, setBaseUnit] = useState('g');
  const [basePricePerUnit, setBasePricePerUnit] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Fetch session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    }
    loadSession();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/products', window.location.origin);
      // We search and filter on the server where appropriate
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (selectedCategory) url.searchParams.set('category', selectedCategory);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load products');
      
      const data = await res.json();
      setProducts(data);

      // Extract unique categories for filter dropdown
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error(err);
      setError('Error fetching products list.');
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

  // Filter products belonging to this seller
  const sellerId = session?.user?.id;
  const myProducts = products.filter(p => p.sellerId === sellerId);

  // Statistics
  const totalListings = myProducts.length;
  const activeListings = myProducts.filter(p => p.isActive).length;
  const deactivatedListings = totalListings - activeListings;
  const lowStockListings = myProducts.filter(p => p.isActive && parseFloat(p.stockQuantity) <= 1000).length;

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentProductId(null);
    setName('');
    setSku('');
    setCategory('');
    setDescription('');
    setBaseUnit('g');
    setBasePricePerUnit('');
    setStockQuantity('');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setModalMode('edit');
    setCurrentProductId(prod.id);
    setName(prod.name);
    setSku(prod.sku || '');
    setCategory(prod.category || '');
    setDescription(prod.description || '');
    setBaseUnit(prod.baseUnit);
    setBasePricePerUnit(prod.basePricePerUnit);
    setStockQuantity(prod.stockQuantity);
    setIsActive(prod.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !basePricePerUnit || stockQuantity === '') {
      setError('Please fill in all required fields (Name, Base Price, and Stock).');
      return;
    }

    const priceNum = parseFloat(basePricePerUnit);
    const stockNum = parseFloat(stockQuantity);

    if (isNaN(priceNum) || priceNum < 0 || isNaN(stockNum) || stockNum < 0) {
      setError('Base price and stock quantity must be non-negative numbers.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let res;
      if (modalMode === 'add') {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            sku: sku.trim() || null,
            category: category.trim() || null,
            description: description.trim() || null,
            baseUnit,
            basePricePerUnit: priceNum.toString(),
            stockQuantity: stockNum.toString(),
          })
        });
      } else {
        res = await fetch(`/api/products/${currentProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            sku: sku.trim() || null,
            category: category.trim() || null,
            description: description.trim() || null,
            baseUnit,
            basePricePerUnit: priceNum.toString(),
            stockQuantity: stockNum.toString(),
            isActive,
          })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product listing');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while saving the listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will hide this product listing from buyers.`)) {
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

      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error deactivating product.');
    }
  };

  const handleReactivate = async (prod) => {
    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          description: prod.description,
          baseUnit: prod.baseUnit,
          basePricePerUnit: prod.basePricePerUnit,
          stockQuantity: prod.stockQuantity,
          isActive: true,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reactivate product');
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error reactivating product.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="h-7 w-7 text-role-accent" />
            Seller Listings Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your pharmaceutical compounds catalogue, configure prices, allocate stock levels, and list new products.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center bg-role-primary hover:bg-role-primary/90 text-role-primary-foreground font-bold px-4 py-2.5 rounded-lg shadow-md transition-all-custom cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Listing
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-28">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Listed Items</span>
          <h3 className="text-3xl font-black text-foreground">{totalListings}</h3>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-28">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Listings</span>
          <h3 className="text-3xl font-black text-emerald-600">{activeListings}</h3>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-28">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Deactivated Listings</span>
          <h3 className="text-3xl font-black text-muted-foreground">{deactivatedListings}</h3>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-28">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Warnings</span>
          <h3 className={`text-3xl font-black ${lowStockListings > 0 ? 'text-amber-500' : 'text-foreground'}`}>
            {lowStockListings}
          </h3>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-col md:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search your listings by name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-lg pl-10 pr-4 py-2.5 bg-secondary/35 text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
          />
        </div>

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
          title="Refresh listings"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Product Listings Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : myProducts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Package className="h-14 w-14 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold text-foreground text-base">No Listings Found</h3>
          <p className="text-muted-foreground text-xs mt-1">
            {totalListings === 0 
              ? 'You have not added any product listings to sell yet. Click "Add New Listing" to get started!'
              : 'Try adjusting your search queries or category filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/45 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-4 px-6">SKU / Code</th>
                  <th className="py-4 px-6">Compound Name / Category</th>
                  <th className="py-4 px-6">Base Unit</th>
                  <th className="py-4 px-6">Base Price</th>
                  <th className="py-4 px-6">Available Stock</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {myProducts.map((prod) => {
                  const stock = parseFloat(prod.stockQuantity);
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= 1000;
                  
                  return (
                    <tr key={prod.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2 py-1 rounded-md">
                          {prod.sku || 'No SKU'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-foreground">{prod.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{prod.category || 'Compounding material'}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-muted-foreground">
                        {getUnitLabel(prod.baseUnit)}
                      </td>
                      <td className="py-4 px-6 font-bold text-foreground">
                        {formatCurrency(prod.basePricePerUnit)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-bold ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-amber-500' : 'text-foreground'}`}>
                          {stock.toLocaleString()} {prod.baseUnit}
                        </span>
                        {isOutOfStock && (
                          <span className="ml-2 inline-flex items-center text-[10px] text-destructive font-bold bg-destructive/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> Empty
                          </span>
                        )}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center text-[10px] text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> Low
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {prod.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 uppercase">
                            <Check className="h-3 w-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border uppercase">
                            <X className="h-3 w-3 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 hover:bg-secondary text-foreground rounded-lg transition-all-custom cursor-pointer"
                            title="Edit Listing details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {prod.isActive ? (
                            <button
                              onClick={() => handleDeactivate(prod.id, prod.name)}
                              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all-custom cursor-pointer"
                              title="Deactivate Listing"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(prod)}
                              className="p-1.5 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 rounded-lg transition-all-custom cursor-pointer"
                              title="Reactivate Listing"
                            >
                              <ArchiveRestore className="h-4 w-4" />
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

      {/* Add / Edit Listing Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-secondary/50 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-role-accent" />
                {modalMode === 'add' ? 'Add New Product Listing' : 'Edit Listing Details'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3.5 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Compound Name */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    Compound / Product Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sodium Bicarbonate USP Grade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
                  />
                </div>

                {/* SKU Code */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    SKU Code (Unique identifier)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SOD-BIC-USP-500"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Buffering Agents, Solvents"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
                  />
                </div>

                {/* Base Unit Measure */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    Base Unit Measure <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={baseUnit}
                    disabled={modalMode === 'edit'} // Lock unit to preserve integrity of historical order calculations
                    onChange={(e) => setBaseUnit(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-bold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom disabled:opacity-50"
                  >
                    <option value="g">Grams (g) - Weight</option>
                    <option value="mL">Milliliters (mL) - Volume</option>
                    <option value="unit">Units (unit) - Individual Count</option>
                  </select>
                </div>

                {/* Base Price */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    Price per Base Unit (INR) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    placeholder={`e.g. 0.12 (₹0.12 per ${baseUnit})`}
                    value={basePricePerUnit}
                    onChange={(e) => setBasePricePerUnit(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    Stock Quantity in Base Unit <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    placeholder={`e.g. 25000 (25,000 ${baseUnit} in stock)`}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
                  />
                  <span className="text-[9px] text-muted-foreground mt-1.5 block leading-relaxed">
                    Must represent base units (e.g. write 25000g instead of 25kg).
                  </span>
                </div>

                {/* Active Toggle (Only for edit) */}
                {modalMode === 'edit' && (
                  <div className="flex items-center space-x-3 bg-secondary/25 p-3 rounded-lg border border-border self-center h-[38px] mt-[14px]">
                    <input
                      type="checkbox"
                      id="modalIsActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-5 w-5 rounded-sm border-border text-role-primary focus:ring-role-accent cursor-pointer"
                    />
                    <label htmlFor="modalIsActive" className="text-xs font-bold text-foreground cursor-pointer select-none">
                      Listing is Active & Visible
                    </label>
                  </div>
                )}

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase tracking-wider mb-1">
                    Product Description / Specifications
                  </label>
                  <textarea
                    placeholder="Describe chemical purity, compounding parameters, storage instructions, hazard warnings..."
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-hidden focus:ring-2 focus:ring-role-accent transition-all-custom"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-secondary text-foreground text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center bg-role-primary hover:bg-role-primary/95 text-role-primary-foreground font-bold px-4 py-2 rounded-lg shadow-sm text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving Listing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" /> Save Listing
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
