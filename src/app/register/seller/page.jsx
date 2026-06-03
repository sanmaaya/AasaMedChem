'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ClipboardCheck, Sparkles, AlertCircle, Check } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle.jsx';

export default function RegisterSellerPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !businessName || !licenseNumber) {
      setError('Please fill in all required fields marked with an asterisk (*).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName,
          licenseNumber,
          notes
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      setSuccess('Your agency has been successfully registered! Redirecting to login...');
      
      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred during registration.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center py-12 px-4 relative transition-colors duration-300">
      {/* Header bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Store
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl bg-card border border-border p-8 rounded-2xl shadow-xl transition-all duration-300 relative z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-1 bg-ring/10 px-3 py-1 rounded-full text-[10px] font-bold text-ring uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Become a Verified Seller Agent</span>
          </div>
          <h2 className="text-3xl font-serif-luxury font-black text-foreground tracking-tight">
            Register Partner Agency
          </h2>
          <p className="text-muted-foreground text-xs mt-1.5 font-medium max-w-md mx-auto">
            Create an agent profile and submit your pharmaceutical business licensing details to list your custom compounds.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-lg p-3.5 flex items-start font-semibold">
            <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm rounded-lg p-3.5 flex items-center font-semibold animate-pulse">
            <Check className="h-5 w-5 mr-2 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Account info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase border-b border-border pb-2">
              1. Account Settings
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5">FULL NAME <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3.5 py-2.5 bg-background font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5">EMAIL ADDRESS <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3.5 py-2.5 bg-background font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5">PASSWORD <span className="text-destructive">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="Create a strong account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3.5 py-2.5 bg-background font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Business info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase border-b border-border pb-2">
              2. Commercial & Business Registry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5">AGENCY / BUSINESS NAME <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Medical Retailers Ltd."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3.5 py-2.5 bg-background font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5">DRUG LICENSE NUMBER / ID <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-APEX-772911"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3.5 py-2.5 bg-background font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground block mb-1.5">COMPANIES SPECIALIZATION & NOTES</label>
                <textarea
                  placeholder="e.g. compounding antibiotics, raw chemical distribution, sterile fluid supplies, logistics reach..."
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3.5 py-2.5 bg-background font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Already have an agent account? <Link href="/login" className="font-bold text-foreground hover:underline">Log in directly</Link>
            </span>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-lg text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Provisioning Partner...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-2" /> Register & Request Access
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
