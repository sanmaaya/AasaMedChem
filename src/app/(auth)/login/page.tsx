'use client';

import React, { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { dashboardPathForRole } from '@/lib/auth-redirect';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Pre-fetch role for role-based redirection to avoid client-side session retrieval latency
      let redirectPath = '/';
      try {
        const roleRes = await fetch('/api/auth/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        if (roleRes.ok) {
          const { role } = await roleRes.json();
          redirectPath = dashboardPathForRole(role);
        }
      } catch (roleErr) {
        console.warn('Could not pre-fetch user role:', roleErr);
      }
      
      // 2. Perform authentication check
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid credentials. Please verify your email and password.');
        setLoading(false);
      } else {
        // Success: Redirect directly using calculated path
        window.location.href = redirectPath;
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 relative transition-colors duration-300">
      {/* Top Navbar Actions (Theme Toggle & Back Link) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Store
        </Link>
        <ThemeToggle />
      </div>

      {/* Main minimal login box */}
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl transition-all duration-300 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xl mx-auto shadow-sm">
            A
          </div>
          <h2 className="text-2xl font-serif-luxury font-black text-foreground mt-4 tracking-tight">
            Sign In to AasaMedChem
          </h2>
          <p className="text-muted-foreground text-xs mt-1.5 font-medium">
            Enter your credentials to access your dashboard console
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-lg p-3.5 mb-5 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@aasa.com"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring/50 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase block">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring/50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 mt-6"
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
        <p className="text-[10px] text-center text-muted-foreground mt-6 leading-relaxed">
          Default Admin account: <span className="font-bold text-foreground">admin@aasa.com</span><br/>
          Need to register? <Link href="/#partner" className="font-bold text-foreground hover:underline">Become a Seller representative</Link>
        </p>
      </div>
    </div>
  );
}
