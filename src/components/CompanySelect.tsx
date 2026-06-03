'use client';

import React, { useState } from 'react';
import { Building2, ChevronDown, Plus, Loader2 } from 'lucide-react';

/**
 * CompanySelect - Buyer organization/company selector
 * Allows buyers to select or create company for their account
 */
export default function CompanySelect({
  companies = [],
  selectedCompany,
  onSelect = async () => {},
  onCreateNew = async () => {},
  loading = false,
  canCreate = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [createError, setCreateError] = useState('');

  const handleSelect = async (company) => {
    await onSelect(company);
    setIsOpen(false);
  };

  const handleCreate = async () => {
    setCreateError('');

    if (!newCompanyName.trim()) {
      setCreateError('Company name is required');
      return;
    }

    if (newCompanyName.trim().length < 2) {
      setCreateError('Company name must be at least 2 characters');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateNew(newCompanyName);
      setNewCompanyName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (error) {
      setCreateError(error.message || 'Failed to create company');
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:border-role-accent text-foreground transition"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">
            {selectedCompany?.name || 'Select Company'}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-40 overflow-hidden">
            {/* Existing Companies */}
            {companies.length > 0 ? (
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company)}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary transition flex items-center justify-between ${
                      selectedCompany?.id === company.id ? 'bg-role-primary/10 border-l-2 border-role-primary' : ''
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{company.name}</p>
                      {company.industry && (
                        <p className="text-xs text-muted-foreground">{company.industry}</p>
                      )}
                    </div>
                    {selectedCompany?.id === company.id && (
                      <div className="h-2 w-2 rounded-full bg-role-primary" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-muted-foreground text-xs">
                No companies yet
              </div>
            )}

            {/* Create New Company */}
            {canCreate && (
              <div className="border-t border-border p-3 space-y-2 bg-secondary/20">
                {isCreating ? (
                  <>
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Enter company name..."
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleCreate();
                      }}
                    />
                    {createError && (
                      <p className="text-xs text-destructive">{createError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreate}
                        disabled={!newCompanyName.trim() || createError}
                        className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                      >
                        {createError ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Create
                          </>
                        ) : (
                          'Create'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setNewCompanyName('');
                          setCreateError('');
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-role-primary font-semibold hover:bg-secondary transition text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Company
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Current Selection Display */}
      {selectedCompany && !isOpen && (
        <div className="mt-2 p-3 rounded-lg bg-role-primary/5 border border-role-primary/20">
          <p className="text-xs text-muted-foreground">Selected Company</p>
          <p className="text-sm font-bold text-foreground">{selectedCompany.name}</p>
        </div>
      )}
    </div>
  );
}
