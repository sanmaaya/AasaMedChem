import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag, 
  Activity, 
  Lock, 
  Sparkles, 
  Coins, 
  Database 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-905 text-white bg-slate-900 relative overflow-hidden font-sans">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">Aasa MedChem</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block -mt-1">Inventory OS</span>
            </div>
          </div>
          <nav className="flex items-center space-x-6">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-350 hover:text-white transition"
            >
              System Status
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center space-y-8 relative z-10">
        {/* Glow pill */}
        <div className="inline-flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Introducing Aasa MedChem OS v1.0</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1] sm:leading-[1.15]">
          High-Precision Compounding <br className="hidden md:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            & Order Allocation Hub
          </span>
        </h1>

        {/* Hero Description */}
        <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          A seamless, database-locked three-party order orchestration system built for Admins, Sellers, and Buyers. Zero floating-point rounding errors with exact volume and weight measurements.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-650 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-650/15 hover:shadow-xl transition-all duration-200 text-sm cursor-pointer group"
          >
            Launch System Console
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold px-6 py-3.5 rounded-xl text-sm transition"
          >
            Read Integration Docs
          </a>
        </div>
      </section>

      {/* Core Roles / Modules Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/60 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">The 3-Party Workflow</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
            Authorized roles integrate seamlessly with inventory safeguards and unit dimension transformations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition duration-200 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-white text-lg">1. Administrator Panel</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Manage wholesale inventory SKU quantities. Authorize pending quotations, trigger transactional locks, and automatically decrement physical raw stock upon approval.
            </p>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-800">
              slate / zinc palette
            </div>
          </div>

          {/* Seller card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition duration-200 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-white text-lg">2. Seller Agent Cart</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Browse compounds with real-time price calculations in weight, volume, or count dimensions (g/kg/mL/L/unit). Link quotations to active buyer accounts with strict validations.
            </p>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider pt-2 border-t border-slate-800">
              royal blue palette
            </div>
          </div>

          {/* Buyer card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/50 transition duration-200 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-white text-lg">3. Buyer Customer Portal</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Transparent read-only order monitoring. Check quotation review statuses, view compounding ratios, lock-in order prices, and display totals with absolute security.
            </p>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider pt-2 border-t border-slate-800">
              emerald green palette
            </div>
          </div>
        </div>
      </section>

      {/* Under the hood Tech Highlights */}
      <section className="bg-slate-900 px-6 py-16 border-t border-slate-850">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Engineered for Pharmaceutical Data Integrity</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed font-medium">
              compounding inventories demand error-free quantity mappings and strict transaction controls. The platform leverages Neon serverless PostgreSQL, executing operations in atomic blocks with decimals-checks to prevent concurrency race hazards.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">6-Decimal Precision</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Uses PostgreSQL numeric(20,6) values with decimal.js calculations.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Database Locks</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">Checks and updates stock inside atomic transactions to prevent double allocation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-inner font-mono text-[11px] text-slate-350 space-y-2.5 overflow-x-auto max-w-full">
            <div className="flex justify-between border-b border-slate-800 pb-2 mb-2 font-bold text-slate-400">
              <span>lib/units.js - Internal Conversions</span>
              <span className="text-blue-400">v1.0</span>
            </div>
            <p className="text-slate-500">// Conversion factor weights and volumes</p>
            <p><span className="text-blue-400">export const</span> UNIT_DIMENSIONS = &#123;</p>
            <p className="pl-4">g:    &#123; dimension: <span className="text-emerald-400">'weight'</span>,  toBase: <span className="text-amber-500">1</span> &#125;,</p>
            <p className="pl-4">kg:   &#123; dimension: <span className="text-emerald-400">'weight'</span>,  toBase: <span className="text-amber-500">1000</span> &#125;,</p>
            <p className="pl-4">mL:   &#123; dimension: <span className="text-emerald-400">'volume'</span>,  toBase: <span className="text-amber-500">1</span> &#125;,</p>
            <p className="pl-4">L:    &#123; dimension: <span className="text-emerald-400">'volume'</span>,  toBase: <span className="text-amber-500">1000</span> &#125;,</p>
            <p className="pl-4">unit: &#123; dimension: <span className="text-emerald-400">'count'</span>,   toBase: <span className="text-amber-500">1</span> &#125;,</p>
            <p>&#125;;</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 bg-slate-905 text-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
        © 2026 Aasa MedChem Inc. All Rights Reserved. Compounding Operations OS.
      </footer>
    </div>
  );
}
