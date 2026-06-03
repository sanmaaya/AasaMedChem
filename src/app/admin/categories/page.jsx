'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ToastProvider.jsx';

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed');
      setCategories(await res.json());
    } catch {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setAdding(true);
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Category "${newName.trim()}" created.`);
      setNewName('');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to create category.');
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Category updated.');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to update.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"? Products using it will retain the text label.`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`"${name}" deleted.`);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Tag className="h-7 w-7 text-role-accent" /> Category Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage product categories used across all listings.</p>
        </div>
        <button onClick={fetchCategories} className="p-2.5 border border-border rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Add New Category */}
      <form onSubmit={handleAdd} className="bg-card border border-border rounded-xl p-5 shadow-xs flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">New Category Name</label>
          <input
            type="text"
            placeholder="e.g. Buffering Agents, Antiseptics..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-secondary/35 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-role-accent transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="inline-flex items-center bg-role-primary text-role-primary-foreground font-bold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Add Category
        </button>
      </form>

      {/* Category List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Tag className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No categories yet. Add your first above.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          <ul className="divide-y divide-border">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 bg-secondary/35 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-role-accent"
                    />
                    <button onClick={() => handleSaveEdit(cat.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg cursor-pointer"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg cursor-pointer"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <span className="font-bold text-foreground text-sm">{cat.name}</span>
                )}
                {editingId !== cat.id && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
