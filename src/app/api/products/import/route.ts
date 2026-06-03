import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { products, categories, stockHistoryLogs } from '@/lib/schema';
import { logAction } from '@/lib/audit';
import { eq } from 'drizzle-orm';

// Sanitized CSV row parser supporting double-quotes and escaped commas
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// POST /api/products/import - Bulk import products via CSV file
export async function POST(request) {
  const session = await auth();

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'seller')) {
    return NextResponse.json({ error: 'Unauthorized. Admin or Seller role required.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No CSV file uploaded.' }, { status: 400 });
    }

    const csvText = await file.text();
    const csvRows = parseCSV(csvText);

    if (csvRows.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or missing headers.' }, { status: 400 });
    }

    const headers = csvRows[0].map(h => h.trim().toLowerCase());
    const dataRows = csvRows.slice(1);

    const nameIdx = headers.indexOf('name');
    const skuIdx = headers.indexOf('sku');
    const categoryIdx = headers.indexOf('category');
    const baseUnitIdx = headers.indexOf('baseunit');
    const basePriceIdx = headers.indexOf('basepriceperunit');
    const stockIdx = headers.indexOf('stockquantity');
    const descIdx = headers.indexOf('description');
    const thresholdIdx = headers.indexOf('lowstockthreshold');

    if (nameIdx === -1 || baseUnitIdx === -1 || basePriceIdx === -1 || stockIdx === -1) {
      return NextResponse.json({
        error: 'Missing required headers. CSV must contain: name, baseUnit, basePricePerUnit, stockQuantity.'
      }, { status: 400 });
    }

    const importedProducts = [];
    const errors = [];

    // Run import inside transaction to preserve atomicity
    await db.transaction(async (tx) => {
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length === 1 && row[0] === '') continue; // Skip empty spacing lines

        const name = row[nameIdx]?.trim();
        const sku = skuIdx !== -1 ? row[skuIdx]?.trim() : null;
        const categoryName = categoryIdx !== -1 ? row[categoryIdx]?.trim() : null;
        const baseUnit = row[baseUnitIdx]?.trim();
        const basePrice = row[basePriceIdx]?.trim();
        const stock = row[stockIdx]?.trim();
        const description = descIdx !== -1 ? row[descIdx]?.trim() : null;
        const threshold = thresholdIdx !== -1 ? row[thresholdIdx]?.trim() : '1000.000000';

        // Basic validation
        if (!name || !baseUnit || !basePrice || !stock) {
          errors.push(`Row ${i + 2}: Missing required values.`);
          continue;
        }

        if (!['g', 'mL', 'unit'].includes(baseUnit)) {
          errors.push(`Row ${i + 2}: Invalid baseUnit '${baseUnit}'. Must be 'g', 'mL', or 'unit'.`);
          continue;
        }

        const priceNum = parseFloat(basePrice);
        const stockNum = parseFloat(stock);
        const thresholdNum = parseFloat(threshold);

        if (isNaN(priceNum) || priceNum < 0 || isNaN(stockNum) || stockNum < 0) {
          errors.push(`Row ${i + 2}: Price and stock levels must be non-negative numeric formats.`);
          continue;
        }

        // Category auto-match/creation
        let categoryId = null;
        if (categoryName) {
          const [existingCat] = await tx.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
          if (existingCat) {
            categoryId = existingCat.id;
          } else {
            const [newCat] = await tx.insert(categories).values({ name: categoryName }).returning();
            categoryId = newCat.id;
          }
        }

        // SKU unique check
        if (sku) {
          const [existingProd] = await tx.select().from(products).where(eq(products.sku, sku)).limit(1);
          if (existingProd) {
            errors.push(`Row ${i + 2}: SKU code '${sku}' is already taken.`);
            continue;
          }
        }

        const listingSellerId = session.user.role === 'seller' ? session.user.id : null;

        const [newProduct] = await tx.insert(products).values({
          name,
          sku: sku || null,
          category: categoryName || null,
          categoryId,
          baseUnit,
          basePricePerUnit: priceNum.toString(),
          stockQuantity: stockNum.toString(),
          lowStockThreshold: isNaN(thresholdNum) ? '1000.000000' : thresholdNum.toString(),
          description: description || null,
          isActive: true,
          sellerId: listingSellerId
        }).returning();

        // Log to stock history logs
        await tx.insert(stockHistoryLogs).values({
          productId: newProduct.id,
          userId: session.user.id,
          oldStock: '0.000000',
          newStock: stockNum.toString(),
          changeReason: 'CSV_IMPORT'
        });

        importedProducts.push(newProduct);
      }

      // Throwing error triggers rollback
      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }
    });

    await logAction(session.user.id, 'PRODUCTS_CSV_IMPORT', { count: importedProducts.length });

    return NextResponse.json({ message: `Successfully imported ${importedProducts.length} products.` });
  } catch (err) {
    console.error('CSV import handler transaction error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process CSV import.' }, { status: 400 });
  }
}
