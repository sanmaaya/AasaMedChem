'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, Mail, Loader2, KeyRound } from 'lucide-react';

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
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password. Please verify your credentials.');
        setLoading(false);
      } else {
        // Success: Redirect to root where middleware will push to the correct dashboard
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Pre-fills form fields for easy testing
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background abstract designs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-md shadow-blue-500/20">
            A
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-4 tracking-tight">Aasa MedChem Hub</h2>
          <p className="text-slate-400 text-xs mt-1">Inventory & Order Management System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm rounded-lg p-3.5 mb-5 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@aasa.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-bold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging in...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Panel */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center justify-center">
            <KeyRound className="h-3.5 w-3.5 mr-1 text-slate-500" /> Test Credentials (Click to Fill)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('admin@aasa.com', 'admin123')}
              className="bg-slate-700 hover:bg-slate-650 text-slate-200 py-2 px-2.5 rounded-lg border border-slate-600/50 hover:border-slate-500 text-left transition font-medium cursor-pointer"
            >
              <div className="font-bold text-[10px] text-blue-400 uppercase">Admin</div>
              <div className="truncate">admin@aasa.com</div>
            </button>
            <button
              onClick={() => handleQuickLogin('seller@aasa.com', 'seller123')}
              className="bg-slate-700 hover:bg-slate-650 text-slate-200 py-2 px-2.5 rounded-lg border border-slate-600/50 hover:border-slate-500 text-left transition font-medium cursor-pointer"
            >
              <div className="font-bold text-[10px] text-amber-400 uppercase">Seller</div>
              <div className="truncate">seller@aasa.com</div>
            </button>
            <button
              onClick={() => handleQuickLogin('buyer@aasa.com', 'buyer123')}
              className="bg-slate-700 hover:bg-slate-650 text-slate-200 py-2 px-2.5 rounded-lg border border-slate-600/50 hover:border-slate-500 text-left transition font-medium cursor-pointer"
            >
              <div className="font-bold text-[10px] text-emerald-400 uppercase">Buyer 1</div>
              <div className="truncate">buyer@aasa.com</div>
            </button>
            <button
              onClick={() => handleQuickLogin('buyer2@aasa.com', 'buyer123')}
              className="bg-slate-700 hover:bg-slate-650 text-slate-200 py-2 px-2.5 rounded-lg border border-slate-600/50 hover:border-slate-500 text-left transition font-medium cursor-pointer"
            >
              <div className="font-bold text-[10px] text-teal-400 uppercase">Buyer 2</div>
              <div className="truncate">buyer2@aasa.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
