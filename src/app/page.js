import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db.js';
import { products } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/units.js';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import { 
  Search, 
  ShoppingBag, 
  ArrowRight, 
  Activity, 
  ShieldCheck, 
  Award, 
  Globe 
} from 'lucide-react';

export const revalidate = 0; // Disable caching

export default async function LuxuryLandingPage() {
  let activeProducts = [];
  let dbError = '';

  try {
    // Fetch active products to show a luxurious product showcase
    activeProducts = await db.select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(4);
  } catch (err) {
    console.warn("Database connection is not configured yet:", err.message);
    dbError = err.message;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-300 flex flex-col justify-between">
      
      {/* Luxury Marketplace Header */}
      <header className="border-b border-stone-200 dark:border-stone-850 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-950 font-black text-xl shadow-sm">
              A
            </div>
            <div>
              <span className="font-serif-luxury font-black text-lg tracking-tight block">Aasa MedChem</span>
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest block -mt-1">Luxury Marketplace</span>
            </div>
          </Link>

          {/* Luxury Search Bar Mockup */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-6 relative">
            <input
              type="text"
              disabled
              placeholder="Search compounding powders, sterile solutions, consumables..."
              className="w-full text-xs border border-stone-200 dark:border-stone-800 rounded-full pl-4 pr-10 py-2.5 bg-stone-50 dark:bg-stone-950 font-medium text-stone-400 cursor-not-allowed"
            />
            <Search className="h-4 w-4 text-stone-400 absolute right-3.5" />
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-bold text-stone-605 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold px-4 py-2.5 rounded-lg text-xs transition cursor-pointer"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-705 dark:text-amber-400 uppercase tracking-widest">
              <Award className="h-3.5 w-3.5" />
              <span>World-Class Chemical Compounding Registry</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif-luxury font-black text-stone-850 dark:text-stone-50 tracking-tight leading-[1.05]">
              Compounding Assets <br />
              & Elite Distribution.
            </h1>
            
            <p className="text-stone-550 dark:text-stone-400 text-sm sm:text-base leading-relaxed font-medium max-w-lg">
              A minimalist, medical B2B commerce standard. Delivering absolute quantity control, Drizzle atomic database locking, and conversion-precision for wholesale pharmaceutical accounts.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-stone-900 hover:bg-stone-805 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold px-6 py-3.5 rounded-xl text-sm transition shadow-md group cursor-pointer"
              >
                Sign In to Console
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register/seller"
                className="inline-flex items-center justify-center bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold px-6 py-3.5 rounded-xl text-sm transition"
              >
                Register as Seller
              </Link>
            </div>
          </div>

          {/* Visual card representive of chemical catalogue */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-xl space-y-4 transition duration-300">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Active Catalogue Preview</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-lg">
                <div>
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200 block">Compounding weight (g/kg)</span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">e.g. Paracetamol Raw Compounding</span>
                </div>
                <span className="text-xs font-bold text-stone-500">Grams</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-lg">
                <div>
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200 block">Compounding volume (mL/L)</span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">e.g. comp solvents, sterile fluid solution</span>
                </div>
                <span className="text-xs font-bold text-stone-500">Milliliters</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-lg">
                <div>
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200 block">Consumable counts (unit)</span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">e.g. protective respirator shields</span>
                </div>
                <span className="text-xs font-bold text-stone-500">Units</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase (Commercial Section) */}
        <section className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-850 py-16 px-6 transition duration-300">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif-luxury font-black text-stone-850 dark:text-stone-100">Featured Chemical Compounds</h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">Compounding chemicals pre-checked and approved for licensed purchase.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbError ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-6 rounded-xl text-xs leading-relaxed max-w-lg mx-auto text-center font-semibold">
                  <p className="font-black text-sm">Database connection not initialized</p>
                  <p className="mt-1 font-medium">{dbError}</p>
                  <p className="mt-3 text-stone-500 dark:text-stone-400">Provide the DATABASE_URL connection string inside a local .env file in the project root to load the active compound catalog.</p>
                </div>
              ) : activeProducts.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 py-8 text-center text-xs text-stone-400 font-bold uppercase tracking-wider">
                  No active products found in the catalog.
                </div>
              ) : (
                activeProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-stone-300 transition duration-200"
                  >
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{prod.category || 'Compound'}</span>
                      <h3 className="font-bold text-stone-800 dark:text-stone-200 text-sm mt-1 line-clamp-1">{prod.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {prod.sku || 'N/A'}</p>
                      <p className="text-xs text-stone-500 mt-2 line-clamp-2 min-h-[2rem]">{prod.description || 'Raw compounding grade compound.'}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-stone-150 dark:border-stone-800 flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-semibold">Price:</span>
                      <strong className="font-bold text-stone-800 dark:text-stone-100">
                        {formatCurrency(prod.basePricePerUnit)} / {prod.baseUnit}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Partner / Become a Seller Section (Required by User request) */}
        <section id="partner" className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mx-auto">
            <Globe className="h-5 w-5" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-serif-luxury font-black text-stone-850 dark:text-stone-50">
            Do you wish to be a seller?
          </h2>
          
          <p className="text-stone-550 dark:text-stone-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium">
            Join the Aasa MedChem network! Request a seller agent account by filling out your business profile, drug licensing registry, and chemical compounding specializations. Once registered, you can immediately begin creating quotations for buyers.
          </p>

          <div>
            <Link
              href="/register/seller"
              className="inline-flex items-center justify-center bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-bold px-6 py-3 rounded-lg text-sm shadow-md transition cursor-pointer"
            >
              Become a Partner Seller representative <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </section>
      </main>

      {/* Luxury Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 py-8 px-6 text-center transition duration-300">
        <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest font-semibold">
          © 2026 Aasa MedChem Inc. All Rights Reserved. Pharmaceutical Supply Chain OS.
        </p>
      </footer>
    </div>
  );
}
