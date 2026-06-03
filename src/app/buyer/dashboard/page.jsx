import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db.js';
import { quotations } from '@/lib/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { formatCurrency, getUnitLabel } from '@/lib/units.js';
import { auth } from '@/auth.js';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Inbox,
  FlaskConical,
  Calendar,
  Layers
} from 'lucide-react';

export const revalidate = 0; // Disable caching

function formatQuantityDisplay(baseQty, baseUnit) {
  const qty = parseFloat(baseQty);
  if (baseUnit === 'g' && qty >= 1000) {
    return `${(qty / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
  }
  if (baseUnit === 'mL' && qty >= 1000) {
    return `${(qty / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`;
  }
  return `${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${baseUnit}`;
}

export default async function BuyerDashboardPage() {
  const session = await auth();
  const buyerId = session.user.id;

  // Run queries in parallel
  const [
    [totalResult],
    [approvedResult],
    [pendingResult],
    approvedListForValue,
    recentQuotations,
    approvedQuotationsForLibrary
  ] = await Promise.all([
    db.select({ value: sql`count(*)` }).from(quotations).where(eq(quotations.buyerId, buyerId)),
    db.select({ value: sql`count(*)` }).from(quotations).where(and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'approved'))),
    db.select({ value: sql`count(*)` }).from(quotations).where(and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'pending'))),
    db.select({ amount: quotations.totalAmount }).from(quotations).where(and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'approved'))),
    db.query.quotations.findMany({
      where: eq(quotations.buyerId, buyerId),
      with: {
        seller: { columns: { name: true } }
      },
      limit: 3,
      orderBy: (quotations, { desc }) => [desc(quotations.createdAt)]
    }),
    db.query.quotations.findMany({
      where: and(eq(quotations.buyerId, buyerId), eq(quotations.status, 'approved')),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    })
  ]);

  const totalQuotes = parseInt(totalResult?.value || '0');
  const approvedQuotes = parseInt(approvedResult?.value || '0');
  const pendingQuotes = parseInt(pendingResult?.value || '0');

  // Sum total value of approved orders
  let approvedValue = new Decimal(0);
  for (const item of approvedListForValue) {
    approvedValue = approvedValue.add(new Decimal(item.amount || 0));
  }

  // Build the Purchased Compounds Library
  const library = {};
  approvedQuotationsForLibrary.forEach(quote => {
    quote.items.forEach(item => {
      if (!item.product) return; // Skip if product doesn't exist anymore
      const prodId = item.productId;
      if (!library[prodId]) {
        library[prodId] = {
          id: prodId,
          name: item.product.name,
          sku: item.product.sku,
          category: item.product.category,
          baseUnit: item.product.baseUnit,
          cumulativeBaseQuantity: new Decimal(0),
          lastPurchaseDate: quote.createdAt,
          lastPriceAtOrder: new Decimal(item.unitPriceAtOrder),
          lastOrderedUnit: item.orderedUnit
        };
      }
      
      library[prodId].cumulativeBaseQuantity = library[prodId].cumulativeBaseQuantity.add(new Decimal(item.baseQuantity));
      
      if (new Date(quote.createdAt) > new Date(library[prodId].lastPurchaseDate)) {
        library[prodId].lastPurchaseDate = quote.createdAt;
        library[prodId].lastPriceAtOrder = new Decimal(item.unitPriceAtOrder);
        library[prodId].lastOrderedUnit = item.orderedUnit;
      }
    });
  });

  const libraryItems = Object.values(library);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Customer Portal</h2>
        <p className="text-sm text-muted-foreground mt-1">Welcome back. View approved quotations, check pending review updates, and track orders.</p>
      </div>

      {/* Empty State Check */}
      {totalQuotes === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border shadow-xs max-w-2xl mx-auto">
          <Inbox className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-bold text-foreground text-lg">No Orders or Quotations Yet</h3>
          <p className="text-muted-foreground text-xs mt-1 px-8 max-w-md mx-auto">
            You don't have any purchase history. Explore the compounds directory to place your first request.
          </p>
          <div className="mt-6">
            <Link
              href="/buyer/products"
              className="inline-flex items-center justify-center bg-role-primary hover:bg-role-primary/95 text-role-primary-foreground font-bold px-5 py-2.5 rounded-lg text-sm shadow-md transition cursor-pointer"
            >
              Browse Products Catalog
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Quotes Received */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Requests</span>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-foreground">{totalQuotes}</h3>
                <p className="text-xs text-muted-foreground mt-1">Quotations created</p>
              </div>
            </div>

            {/* Approved Count */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Orders</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-foreground">{approvedQuotes}</h3>
                <p className="text-xs text-muted-foreground mt-1">Confirmed purchases</p>
              </div>
            </div>

            {/* Pending Count */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Awaiting Review</span>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-foreground">{pendingQuotes}</h3>
                <p className="text-xs text-muted-foreground mt-1">Awaiting authorization</p>
              </div>
            </div>

            {/* Approved Value */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs flex flex-col justify-between h-36">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Value</span>
                <TrendingUp className="h-5 w-5 text-role-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground truncate">{formatCurrency(approvedValue.toNumber())}</h3>
                <p className="text-xs text-muted-foreground mt-1">Total approved spend</p>
              </div>
            </div>
          </div>

          {/* Purchased Compounds Library */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-role-accent" />
                Purchased Compounds Library
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your unique portfolio of compounds acquired, showing cumulative quantities and latest pricing details.
              </p>
            </div>

            {libraryItems.length === 0 ? (
              <div className="text-center py-10 bg-card rounded-xl border border-border shadow-xs">
                <FlaskConical className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-muted-foreground text-xs">No approved compound purchases found. Once Admin authorizes a quotation, your library will populate.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {libraryItems.map((item) => (
                  <div key={item.id} className="bg-card rounded-xl border border-border p-4 shadow-xs flex flex-col justify-between hover:border-role-accent transition-all duration-200">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        {item.category || 'Compounding Material'}
                      </span>
                      <h4 className="font-bold text-foreground text-sm leading-snug line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {item.sku || 'N/A'}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground block uppercase">Cumulative Qty</span>
                        <strong className="text-foreground text-sm font-extrabold block mt-0.5">
                          {formatQuantityDisplay(item.cumulativeBaseQuantity.toNumber(), item.baseUnit)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground block uppercase">Last Price Paid</span>
                        <strong className="text-role-primary font-black block mt-0.5">
                          {formatCurrency(item.lastPriceAtOrder.toNumber())} / {getUnitLabel(item.lastOrderedUnit)}
                        </strong>
                      </div>
                      <div className="col-span-2 mt-2 pt-2 border-t border-border/50 flex items-center text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1 text-role-accent" />
                        <span>Last Purchased: {new Date(item.lastPurchaseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent list */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-4xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-role-accent" />
                  Recent Sales Transactions
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Recent quotation requests and transaction statuses</p>
              </div>
              <Link
                href="/buyer/quotations"
                className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center bg-secondary/55 px-3 py-1.5 rounded-lg border border-border transition-all-custom"
              >
                All Orders <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {recentQuotations.map((quote) => (
                <div key={quote.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Quotation #{quote.id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Seller agent: <span className="font-semibold text-foreground">{quote.seller?.name}</span> • Created {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      quote.status === 'approved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                      quote.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      'bg-amber-550/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                    }`}>
                      {quote.status}
                    </span>
                    <strong className="text-sm font-black text-foreground">
                      {formatCurrency(quote.totalAmount)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
