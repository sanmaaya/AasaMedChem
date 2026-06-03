'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid credentials. Please verify your email and password.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center items-center px-4 relative transition-colors duration-300">
      {/* Top Navbar Actions (Theme Toggle & Back Link) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Store
        </Link>
        <ThemeToggle />
      </div>

      {/* Main minimal luxury login box */}
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl shadow-xl transition-all duration-300 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="h-11 w-11 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-950 font-black text-xl mx-auto shadow-sm">
            A
          </div>
          <h2 className="text-2xl font-serif-luxury font-black text-stone-850 dark:text-stone-100 mt-4 tracking-tight">
            Sign In to AasaMedChem
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1.5 font-medium">
            Enter your credentials to access your dashboard console
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-lg p-3.5 mb-5 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold tracking-wider text-stone-400 dark:text-stone-500 uppercase block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400 dark:text-stone-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@aasa.com"
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold tracking-wider text-stone-400 dark:text-stone-500 uppercase block">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400 dark:text-stone-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 py-3 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authorizing...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>
        
        {/* Helper footer */}
        <p className="text-[10px] text-center text-stone-450 dark:text-stone-500 mt-6 leading-relaxed">
          Default Admin account: <span className="font-bold text-stone-600 dark:text-stone-400">admin@aasa.com</span><br/>
          Need to register? <Link href="/#partner" className="font-bold text-stone-800 dark:text-stone-200 hover:underline">Become a Seller representative</Link>
        </p>
      </div>
    </div>
  );
}
