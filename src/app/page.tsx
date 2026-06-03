import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/units';
import ThemeToggle from '@/components/ThemeToggle';
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between">
      
      {/* Marketplace Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4.5rem] py-3 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-3.5 shrink-0 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
              A
            </div>
            <div className="min-w-0 leading-tight">
              <span className="font-serif-luxury font-black text-base sm:text-lg tracking-tight block truncate">AasaMedChem</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.12em] block mt-0.5">Pharmaceutical Registry</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4 lg:mx-8 relative min-w-[12rem]">
            <input
              type="text"
              disabled
              placeholder="Search compounding powders, sterile solutions, consumables..."
              className="w-full text-xs border border-border rounded-full pl-4 pr-10 py-2.5 bg-background font-medium text-muted-foreground cursor-not-allowed"
            />
            <Search className="h-4 w-4 text-muted-foreground absolute right-3.5" />
          </div>

          {/* User actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline text-xs font-bold text-muted-foreground hover:text-foreground transition px-2 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
            >
              Access Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-1.5 bg-accent px-3 py-1.5 rounded-full text-[10px] font-bold text-accent-foreground uppercase tracking-widest border border-border">
              <Award className="h-3.5 w-3.5 text-role-accent" />
              <span>Chemical Compounding Registry</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif-luxury font-black text-foreground tracking-tight leading-[1.05]">
              Compounding Assets <br />
              & Distribution.
            </h1>
            
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium max-w-lg">
              A minimalist, medical B2B commerce standard. Delivering absolute quantity control, Drizzle atomic database locking, and conversion-precision for wholesale pharmaceutical accounts.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3.5 rounded-xl text-sm transition shadow-md group cursor-pointer"
              >
                Access Dashboard Portal
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register/seller"
                className="inline-flex items-center justify-center bg-card hover:bg-secondary/40 text-foreground border border-border font-bold px-6 py-3.5 rounded-xl text-sm transition"
              >
                Become a Seller
              </Link>
            </div>
          </div>

          {/* Visual card representive of chemical catalogue */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-xl space-y-4 transition duration-300">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Catalogue Preview</span>
              <div className="h-2 w-2 rounded-full bg-role-accent animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary/45 border border-border rounded-lg">
                <div>
                  <span className="font-bold text-xs text-foreground block">Compounding weight (g/kg)</span>
                  <span className="text-[10px] text-muted-foreground">e.g. Paracetamol Raw Compounding</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">Grams</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/45 border border-border rounded-lg">
                <div>
                  <span className="font-bold text-xs text-foreground block">Compounding volume (mL/L)</span>
                  <span className="text-[10px] text-muted-foreground">e.g. comp solvents, sterile fluid solution</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">Milliliters</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/45 border border-border rounded-lg">
                <div>
                  <span className="font-bold text-xs text-foreground block">Consumable counts (unit)</span>
                  <span className="text-[10px] text-muted-foreground">e.g. protective respirator shields</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">Units</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase (Commercial Section) */}
        <section className="bg-card border-t border-b border-border py-16 px-6 transition duration-300">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif-luxury font-black text-foreground">Featured Chemical Compounds</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">Compounding chemicals pre-checked and approved for licensed purchase.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dbError ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-accent/50 border border-border text-accent-foreground p-6 rounded-xl text-xs leading-relaxed max-w-lg mx-auto text-center font-semibold">
                  <p className="font-black text-sm">Database connection not initialized</p>
                  <p className="mt-1 font-medium">{dbError}</p>
                  <p className="mt-3 text-muted-foreground">Provide the DATABASE_URL connection string inside a local .env file in the project root to load the active compound catalog.</p>
                </div>
              ) : activeProducts.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 py-8 text-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  No active products found in the catalog.
                </div>
              ) : (
                activeProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-secondary/35 border border-border rounded-xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-primary/50 transition duration-200"
                  >
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{prod.category || 'Compound'}</span>
                      <h3 className="font-bold text-foreground text-sm mt-1 line-clamp-1">{prod.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {prod.sku || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[2rem]">{prod.description || 'Raw compounding grade compound.'}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">Price:</span>
                      <strong className="font-bold text-foreground">
                        {formatCurrency(prod.basePricePerUnit)} / {prod.baseUnit}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Partner / Become a Seller Section */}
        <section id="partner" className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-role-accent mx-auto border border-border">
            <Globe className="h-5 w-5" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-serif-luxury font-black text-foreground">
            Do you wish to be a seller?
          </h2>
          
          <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium">
            Join the AasaMedChem network! Request a seller agent account by filling out your business profile, drug licensing registry, and chemical compounding specializations. Once registered, you can immediately begin creating quotations for buyers.
          </p>

          <div>
            <Link
              href="/register/seller"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 rounded-lg text-sm shadow-md transition cursor-pointer"
            >
              Become a Partner Seller representative <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-6 text-center transition duration-300">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
          © 2026 AasaMedChem Inc. All Rights Reserved. Pharmaceutical Supply Chain OS.
        </p>
      </footer>
    </div>
  );
}
