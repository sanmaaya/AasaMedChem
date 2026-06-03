import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { products, stockHistoryLogs, auditLogs, categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';
import Decimal from 'decimal.js';

/**
 * POST /api/products/bulk-import
 * Upload CSV file with product data
 * Expected columns: name, sku, category, baseUnit, price, stock, description (optional)
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('csv') && !file.type.includes('spreadsheet')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse CSV
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const MAX_ROWS = parseInt(process.env.CSV_MAX_ROWS || '1000');
    if (records.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `CSV exceeds ${MAX_ROWS} row limit` },
        { status: 400 }
      );
    }

    // Fetch all categories for validation
    const allCategories = await db.select().from(categories);
    const categoryMap = Object.fromEntries(
      allCategories.map(c => [c.name.toLowerCase(), c.id])
    );

    // Process records
    const results = {
      success: [],
      errors: [],
      skipped: 0,
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 for 1-indexed + header

      try {
        // Validate required fields
        const { name, sku, category, baseUnit, price, stock, description } = row;

        if (!name?.trim()) {
          results.errors.push({
            row: rowNumber,
            error: 'Product name is required',
          });
          continue;
        }

        if (!sku?.trim()) {
          results.errors.push({
            row: rowNumber,
            error: 'SKU is required',
          });
          continue;
        }

        if (!category?.trim()) {
          results.errors.push({
            row: rowNumber,
            error: 'Category is required',
          });
          continue;
        }

        // Lookup category ID
        const categoryId = categoryMap[category.toLowerCase()];
        if (!categoryId) {
          results.errors.push({
            row: rowNumber,
            error: `Category '${category}' not found`,
          });
          continue;
        }

        // Validate numeric fields
        let priceValue, stockValue;
        try {
          priceValue = new Decimal(price || 0);
          stockValue = new Decimal(stock || 0).toNumber();
        } catch (e) {
          results.errors.push({
            row: rowNumber,
            error: 'Invalid price or stock value',
          });
          continue;
        }

        // Check for duplicate SKU
        const existing = await db
          .select()
          .from(products)
          .where(eq(products.sku, sku.trim()))
          .limit(1);

        if (existing.length > 0) {
          results.skipped++;
          results.errors.push({
            row: rowNumber,
            error: `SKU '${sku}' already exists`,
          });
          continue;
        }

        // Insert product
        const inserted = await db
          .insert(products)
          .values({
            name: name.trim(),
            sku: sku.trim(),
            categoryId,
            baseUnit: baseUnit?.trim() || 'unit',
            price: priceValue.toString(),
            stock: stockValue,
            lowStockThreshold: 10,
            description: description?.trim() || '',
            createdBy: session.user.id,
          })
          .returning();

        // Log stock history
        if (stockValue > 0) {
          await db.insert(stockHistoryLogs).values({
            productId: inserted[0].id,
            oldStock: 0,
            newStock: stockValue,
            changeReason: 'CSV_IMPORT',
            changedBy: session.user.id,
          });
        }

        results.success.push({
          row: rowNumber,
          id: inserted[0].id,
          sku: sku.trim(),
        });
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
        });
      }
    }

    // Log bulk import audit event
    if (results.success.length > 0) {
      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: 'bulk_import_products',
        entityType: 'product_import',
        entityId: null,
        changes: `Imported ${results.success.length} products via CSV`,
      });
    }

    return NextResponse.json(
      {
        ...results,
        total: records.length,
        import_date: new Date().toISOString(),
      },
      {
        status: results.success.length > 0 ? 200 : 400,
      }
    );
  } catch (error) {
    console.error('POST /api/products/bulk-import error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV import' },
      { status: 500 }
    );
  }
}
