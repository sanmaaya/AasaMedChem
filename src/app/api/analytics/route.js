import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  quotations,
  quotationItems,
  users,
  products,
  categories,
} from '@/lib/schema';
import { eq, and, or, gte, lte, sum } from 'drizzle-orm';
import Decimal from 'decimal.js';

/**
 * GET /api/analytics/seller-performance
 * Get seller performance metrics by revenue and orders
 * Query params: timeRange (daily, weekly, monthly), sellerId
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'monthly';
    const reportType = searchParams.get('type') || 'seller-performance';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    if (reportType === 'seller-performance') {
      // Group quotations by seller and calculate metrics
      const sellerStats = await db
        .select({
          sellerId: quotations.sellerId,
          sellerName: users.name,
          revenue: sum(quotations.totalAmount),
          orders: sum(quotations.id), // Count
          approved: sum(quotations.status === 'approved' ? 1 : 0),
        })
        .from(quotations)
        .innerJoin(users, eq(quotations.sellerId, users.id))
        .where(
          and(
            gte(quotations.createdAt, startDate),
            lte(quotations.createdAt, now)
          )
        )
        .groupBy(quotations.sellerId, users.name);

      // Transform results
      const data = sellerStats.map(stat => ({
        sellerId: stat.sellerId,
        sellerName: stat.sellerName,
        revenue: new Decimal(stat.revenue || 0).toNumber(),
        orders: parseInt(stat.orders || 0),
        approved: parseInt(stat.approved || 0),
        conversionRate: stat.orders ? (parseInt(stat.approved || 0) / parseInt(stat.orders)) * 100 : 0,
      }));

      return NextResponse.json({
        type: 'seller-performance',
        timeRange,
        startDate,
        endDate: now,
        data,
        summary: {
          totalSellers: data.length,
          totalRevenue: data.reduce((sum, s) => sum + s.revenue, 0),
          totalOrders: data.reduce((sum, s) => sum + s.orders, 0),
          averageOrderValue:
            data.length > 0
              ? data.reduce((sum, s) => sum + s.revenue, 0) /
                data.reduce((sum, s) => sum + s.orders, 1)
              : 0,
        },
      });
    }

    if (reportType === 'category-performance') {
      // Group products by category and show sales metrics
      const categoryStats = await db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          totalRevenue: sum(quotationItems.lineTotal),
          totalUnits: sum(quotationItems.orderedQuantity),
          orderCount: sum(quotations.id),
        })
        .from(quotationItems)
        .innerJoin(products, eq(quotationItems.productId, products.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .innerJoin(quotations, eq(quotationItems.quotationId, quotations.id))
        .where(
          and(
            gte(quotations.createdAt, startDate),
            lte(quotations.createdAt, now)
          )
        )
        .groupBy(categories.id, categories.name);

      const data = categoryStats.map(stat => ({
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        revenue: new Decimal(stat.totalRevenue || 0).toNumber(),
        units: parseInt(stat.totalUnits || 0),
        orders: parseInt(stat.orderCount || 0),
        avgOrderValue: parseInt(stat.orderCount || 1)
          ? new Decimal(stat.totalRevenue || 0).dividedBy(stat.orderCount).toNumber()
          : 0,
      }));

      return NextResponse.json({
        type: 'category-performance',
        timeRange,
        startDate,
        endDate: now,
        data,
      });
    }

    if (reportType === 'quotation-status') {
      // Count quotations by status
      const statusStats = await db
        .select({
          status: quotations.status,
          count: sum(quotations.id),
          totalAmount: sum(quotations.totalAmount),
        })
        .from(quotations)
        .where(
          and(
            gte(quotations.createdAt, startDate),
            lte(quotations.createdAt, now)
          )
        )
        .groupBy(quotations.status);

      const data = statusStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.count || 0),
        totalAmount: new Decimal(stat.totalAmount || 0).toNumber(),
      }));

      return NextResponse.json({
        type: 'quotation-status',
        timeRange,
        startDate,
        endDate: now,
        data,
        summary: {
          total: data.reduce((sum, s) => sum + s.count, 0),
          totalValue: data.reduce((sum, s) => sum + s.totalAmount, 0),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/export
 * Export analytics data as CSV/Excel
 * Body: { format: 'csv' | 'excel', reportType, timeRange }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { format, reportType, timeRange } = await request.json();

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Fetch data based on reportType using the same logic as GET
    // Then convert to CSV/Excel format

    // For now, return a simple CSV response
    let csvContent = 'Seller Name,Revenue,Orders,Conversion Rate\n';

    if (reportType === 'seller-performance') {
      // Build CSV from seller stats
      const sellerStats = await db
        .select({
          sellerId: quotations.sellerId,
          sellerName: users.name,
          revenue: sum(quotations.totalAmount),
        })
        .from(quotations)
        .innerJoin(users, eq(quotations.sellerId, users.id))
        .groupBy(quotations.sellerId, users.name);

      sellerStats.forEach(stat => {
        csvContent += `${stat.sellerName},${stat.revenue || 0},0,0\n`;
      });
    }

    if (format === 'csv') {
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${reportType}-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      error: 'Excel export coming soon',
      format: 'csv_available',
    });
  } catch (error) {
    console.error('POST /api/analytics/export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
