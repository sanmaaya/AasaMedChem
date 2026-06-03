'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * CategoryManager - CRUD component for product categories
 * Allows admin to create, edit, and delete categories
 */
export default function CategoryManager({
  categories = [],
  onAdd = async () => {},
  onUpdate = async () => {},
  onDelete = async () => {},
  loading = false,
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleAddClick = () => {
    setNewName('');
    setIsAddOpen(true);
  };

  const handleAddSubmit = async () => {
    if (newName.trim()) {
      setSubmitLoading(true);
      await onAdd(newName);
      setSubmitLoading(false);
      setNewName('');
      setIsAddOpen(false);
    }
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleEditSubmit = async () => {
    if (editName.trim() && editingId) {
      setSubmitLoading(true);
      await onUpdate(editingId, editName);
      setSubmitLoading(false);
      setEditingId(null);
      setEditName('');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      setSubmitLoading(true);
      await onDelete(deleteConfirm);
      setSubmitLoading(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <button
        onClick={handleAddClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-role-primary text-role-primary-foreground font-semibold hover:bg-role-primary/90 transition disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>

      {/* Add Form */}
      {isAddOpen && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddSubmit}
              disabled={!newName.trim() || submitLoading}
              className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add
            </button>
            <button
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-role-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading categories...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs bg-card rounded-lg border border-border">
            No categories yet. Create one to get started.
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between bg-card border border-border p-4 rounded-lg hover:border-role-accent transition">
              {editingId === cat.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition"
                    autoFocus
                  />
                  <button
                    onClick={handleEditSubmit}
                    disabled={!editName.trim() || submitLoading}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{cat.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(cat)}
                      disabled={loading}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition disabled:opacity-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      disabled={loading}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        type="danger"
        title="Delete Category"
        message="Are you sure? Products in this category will not be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        confirmLoading={submitLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
