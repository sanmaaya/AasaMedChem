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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center items-center py-12 px-4 relative transition-colors duration-300">
      {/* Header bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Store
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl shadow-xl transition-all duration-300 relative z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-1 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-amber-705 dark:text-amber-400 uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Become a Verified Seller Agent</span>
          </div>
          <h2 className="text-3xl font-serif-luxury font-black text-stone-850 dark:text-stone-100 tracking-tight">
            Register Partner Agency
          </h2>
          <p className="text-stone-550 dark:text-stone-400 text-xs mt-1.5 font-medium max-w-md mx-auto">
            Create an agent profile and submit your pharmaceutical business licensing details to list your custom compounds.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-lg p-3.5 flex items-start font-semibold">
            <AlertCircle className="h-5 w-5 text-red-650 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm rounded-lg p-3.5 flex items-center font-semibold animate-pulse">
            <Check className="h-5 w-5 text-emerald-650 mr-2 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Account info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 dark:text-stone-500 uppercase border-b border-stone-100 dark:border-stone-800 pb-2">
              1. Account Settings
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">FULL NAME <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-stone-200 dark:border-stone-850 rounded-lg px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition-all"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">EMAIL ADDRESS <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-stone-200 dark:border-stone-850 rounded-lg px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">PASSWORD <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="Create a strong account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm border border-stone-200 dark:border-stone-850 rounded-lg px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Business info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 dark:text-stone-500 uppercase border-b border-stone-100 dark:border-stone-800 pb-2">
              2. Commercial & Business Registry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">AGENCY / BUSINESS NAME <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Medical Retailers Ltd."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-sm border border-stone-200 dark:border-stone-850 rounded-lg px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">DRUG LICENSE NUMBER / ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-APEX-772911"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-sm border border-stone-200 dark:border-stone-850 rounded-lg px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">COMPANIES SPECIALIZATION & NOTES</label>
                <textarea
                  placeholder="e.g. compounding antibiotics, raw chemical distribution, sterile fluid supplies, logistics reach..."
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm border border-stone-200 dark:border-stone-850 rounded-lg px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 font-semibold text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Already have an agent account? <Link href="/login" className="font-bold text-stone-805 dark:text-stone-100 hover:underline">Log in directly</Link>
            </span>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-250 text-white dark:text-stone-950 font-bold px-6 py-3 rounded-lg text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
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
