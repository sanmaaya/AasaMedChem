'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/units.js';

/**
 * SellerPerformance - Performance metrics bar chart for sellers
 * Shows revenue, orders, and conversion rates by seller
 */
export default function SellerPerformance({
  data = [],
  loading = false,
  onSellerClick = () => {},
  timeRange = 'monthly',
}) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs font-bold text-foreground">{data.sellerName}</p>
          <p className="text-xs text-role-primary mt-1">
            Revenue: {formatCurrency(data.revenue)}
          </p>
          <p className="text-xs text-emerald-600">Orders: {data.orders}</p>
          <p className="text-xs text-blue-600">Conversion: {(data.conversionRate || 0).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-role-accent" />
          Seller Performance
        </h3>
        <p className="text-xs text-muted-foreground">
          Revenue and order metrics by seller for {timeRange} period
        </p>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-lg p-4 h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
              <p className="text-xs text-muted-foreground">Loading performance data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No performance data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="sellerName"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Bar
                dataKey="revenue"
                fill="#3b82f6"
                name="Revenue"
                onClick={(data) => onSellerClick(data)}
                cursor="pointer"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="orders"
                fill="#10b981"
                name="Orders"
                onClick={(data) => onSellerClick(data)}
                cursor="pointer"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Summary */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Top Seller by Revenue */}
          {data[0] && (
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
                Top Seller (Revenue)
              </p>
              <p className="text-lg font-bold text-foreground">{data[0].sellerName}</p>
              <p className="text-sm text-role-primary font-semibold mt-1">
                {formatCurrency(data[0].revenue)}
              </p>
            </div>
          )}

          {/* Total Revenue */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
              Total Revenue
            </p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(
                data.reduce((sum, item) => sum + (item.revenue || 0), 0)
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.length} sellers
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">
              Total Orders
            </p>
            <p className="text-lg font-bold text-foreground">
              {data.reduce((sum, item) => sum + (item.orders || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {(data.reduce((sum, item) => sum + (item.orders || 0), 0) / data.length).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Table View */}
      {data.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 border-b border-border">
                  <th className="px-4 py-3 text-left font-bold text-foreground">Seller</th>
                  <th className="px-4 py-3 text-right font-bold text-foreground">Revenue</th>
                  <th className="px-4 py-3 text-right font-bold text-foreground">Orders</th>
                  <th className="px-4 py-3 text-right font-bold text-foreground">Avg Order</th>
                  <th className="px-4 py-3 text-right font-bold text-foreground">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((seller, index) => (
                  <tr
                    key={seller.sellerId || index}
                    onClick={() => onSellerClick(seller)}
                    className="hover:bg-secondary/20 transition cursor-pointer"
                  >
                    <td className="px-4 py-3 text-foreground font-semibold">
                      {seller.sellerName}
                    </td>
                    <td className="px-4 py-3 text-right text-role-primary font-bold">
                      {formatCurrency(seller.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                      {seller.orders}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-bold">
                      {formatCurrency((seller.revenue / seller.orders) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        (seller.conversionRate || 0) > 50
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {(seller.conversionRate || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
