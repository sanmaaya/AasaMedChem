import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/schema.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Clean existing records in dependency order
    console.log("Cleaning existing database records...");
    await db.delete(schema.quotationComments);
    await db.delete(schema.notifications);
    await db.delete(schema.auditLogs);
    await db.delete(schema.stockHistoryLogs);
    await db.delete(schema.quotationItems);
    await db.delete(schema.quotations);
    await db.delete(schema.products);
    await db.delete(schema.categories);
    await db.delete(schema.users);
    console.log("Database cleaned.");

    // 2. Hash passwords
    console.log("Hashing passwords...");
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const sellerPasswordHash = await bcrypt.hash('seller123', 10);
    const buyerPasswordHash = await bcrypt.hash('buyer123', 10);

    // 3. Insert users
    console.log("Inserting users...");
    // Seed Admin & Seller first
    const [admin, seller] = await db.insert(schema.users).values([
      {
        email: 'admin@aasa.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        name: 'AASA System Administrator',
        phone: '+91 90000 11111',
        companyName: 'Aasa MedChem Ltd.',
        businessInfo: null,
      },
      {
        email: 'seller@aasa.com',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        name: 'Rahul Sharma (Seller Agent)',
        phone: '+91 80000 22222',
        companyName: 'Aasa MedChem Retailers Ltd.',
        businessInfo: JSON.stringify({
          businessName: "Aasa MedChem Retailers Ltd.",
          licenseNumber: "LIC-MED-772911",
          notes: "Designated default wholesale agent."
        }),
      },
    ]).returning();

    // Seed Buyers with sellerId reference (Rahul Sharma)
    const [buyer1, buyer2] = await db.insert(schema.users).values([
      {
        email: 'buyer@aasa.com',
        passwordHash: buyerPasswordHash,
        role: 'buyer',
        name: 'Apollo Pharmacy Delhi (Buyer)',
        phone: '+91 98765 43210',
        companyName: 'Apollo Pharmacy Ltd.',
        sellerId: seller.id,
        businessInfo: null,
      },
      {
        email: 'buyer2@aasa.com',
        passwordHash: buyerPasswordHash,
        role: 'buyer',
        name: 'MedPlus Pharmacy Gurgaon (Buyer 2)',
        phone: '+91 99999 88888',
        companyName: 'MedPlus Ltd.',
        sellerId: seller.id,
        businessInfo: null,
      },
    ]).returning();

    console.log(`Seeded users: 
      - Admin: ${admin.email}
      - Seller: ${seller.email}
      - Buyer 1: ${buyer1.email} (Assigned to Rahul Sharma)
      - Buyer 2: ${buyer2.email} (Assigned to Rahul Sharma)`);

    // 4. Seed Managed Categories
    console.log("Inserting categories...");
    const [catActive, catFluids, catConsumables, catAntibiotics, catSolvents] = await db.insert(schema.categories).values([
      { name: 'Active Ingredients' },
      { name: 'Fluids' },
      { name: 'Consumables' },
      { name: 'Antibiotics' },
      { name: 'Solvents' },
    ]).returning();

    // 5. Insert products
    console.log("Inserting products...");
    const [paraPow, salineSol, n95Masks, amoxTri, ipaSolvent] = await db.insert(schema.products).values([
      {
        name: 'Paracetamol Powder (1kg Bag)',
        sku: 'PARA-POW-1KG',
        category: 'Active Ingredients',
        categoryId: catActive.id,
        description: 'Raw pharmaceutical grade Paracetamol powder. High purity active ingredient.',
        baseUnit: 'g',
        basePricePerUnit: '0.060000', // ₹0.06 per gram
        stockQuantity: '100000.000000', // 100 kg
        lowStockThreshold: '10000.000000', // 10 kg
        isActive: true,
        sellerId: seller.id,
      },
      {
        name: 'Saline Solution Sol-A',
        sku: 'SALI-SOL-500',
        category: 'Fluids',
        categoryId: catFluids.id,
        description: 'Sterile saline solution for compounding and infusion prep.',
        baseUnit: 'mL',
        basePricePerUnit: '0.150000',
        stockQuantity: '49500.000000',
        lowStockThreshold: '5000.000000',
        isActive: true,
        sellerId: seller.id,
      },
      {
        name: 'N95 Respirator Masks',
        sku: 'MASK-N95-001',
        category: 'Consumables',
        categoryId: catConsumables.id,
        description: 'Standard protective N95 facial respirator mask (individual pack).',
        baseUnit: 'unit',
        basePricePerUnit: '45.000000',
        stockQuantity: '1100.000000',
        lowStockThreshold: '200.000000',
        isActive: true,
        sellerId: seller.id,
      },
      {
        name: 'Amoxicillin Trihydrate',
        sku: 'AMOX-TRI-250',
        category: 'Antibiotics',
        categoryId: catAntibiotics.id,
        description: 'Amoxicillin pharmaceutical grade material in powder form.',
        baseUnit: 'g',
        basePricePerUnit: '0.120000',
        stockQuantity: '50000.000000',
        lowStockThreshold: '5000.000000',
        isActive: true,
        sellerId: seller.id,
      },
      {
        name: 'Isopropyl Alcohol 99%',
        sku: 'IPA-99-1000',
        category: 'Solvents',
        categoryId: catSolvents.id,
        description: 'Compounding grade 99% pure Isopropyl Alcohol solvent.',
        baseUnit: 'mL',
        basePricePerUnit: '0.080000',
        stockQuantity: '80000.000000',
        lowStockThreshold: '10000.000000',
        isActive: true,
        sellerId: seller.id,
      },
    ]).returning();

    // 6. Seed Product Variants
    // Create "Paracetamol Powder (5kg Bag)" as a variant of the "1kg Bag" product
    const [paraPowVariant] = await db.insert(schema.products).values([
      {
        name: 'Paracetamol Powder (5kg Bag)',
        sku: 'PARA-POW-5KG',
        category: 'Active Ingredients',
        categoryId: catActive.id,
        description: 'Bulk package of raw pharmaceutical grade Paracetamol powder. Bulk discounted rate.',
        baseUnit: 'g',
        basePricePerUnit: '0.050000', // ₹0.05 per gram (cheaper per gram than 1kg bag)
        stockQuantity: '200000.000000', // 200 kg
        lowStockThreshold: '20000.000000',
        parentProductId: paraPow.id, // Variant link
        isActive: true,
        sellerId: seller.id,
      }
    ]).returning();

    console.log(`Seeded products & variants.`);

    // 7. Seed Initial Stock History Logs
    console.log("Inserting stock logs...");
    await db.insert(schema.stockHistoryLogs).values([
      { productId: paraPow.id, userId: admin.id, oldStock: '0.000000', newStock: '100000.000000', changeReason: 'MANUAL_EDIT' },
      { productId: salineSol.id, userId: admin.id, oldStock: '0.000000', newStock: '49500.000000', changeReason: 'MANUAL_EDIT' },
      { productId: n95Masks.id, userId: admin.id, oldStock: '0.000000', newStock: '1100.000000', changeReason: 'MANUAL_EDIT' },
      { productId: amoxTri.id, userId: admin.id, oldStock: '0.000000', newStock: '50000.000000', changeReason: 'MANUAL_EDIT' },
      { productId: ipaSolvent.id, userId: admin.id, oldStock: '0.000000', newStock: '80000.000000', changeReason: 'MANUAL_EDIT' },
      { productId: paraPowVariant.id, userId: admin.id, oldStock: '0.000000', newStock: '200000.000000', changeReason: 'MANUAL_EDIT' },
    ]);

    // 8. Insert mock quotations to populate dashboard statistics
    console.log("Inserting mock quotations...");

    // Quotation 1: PENDING review
    // Seller Rahul Sharma, Buyer Apollo Pharmacy (Buyer 1)
    const [quotePending] = await db.insert(schema.quotations).values({
      sellerId: seller.id,
      buyerId: buyer1.id,
      status: 'pending',
      orderStatus: 'pending',
      totalAmount: '1000.000000', // ₹1000 (₹600 for Paracetamol + ₹400 for IPA)
      notes: 'Requesting express compound delivery and safety certificate.',
    }).returning();

    await db.insert(schema.quotationItems).values([
      {
        quotationId: quotePending.id,
        productId: paraPow.id,
        orderedUnit: 'kg',
        orderedQuantity: '10.000000',
        baseQuantity: '10000.000000',
        unitPriceAtOrder: '60.000000',
        lineTotal: '600.000000',
      },
      {
        quotationId: quotePending.id,
        productId: ipaSolvent.id,
        orderedUnit: 'L',
        orderedQuantity: '5.000000',
        baseQuantity: '5000.000000',
        unitPriceAtOrder: '80.000000',
        lineTotal: '400.000000',
      }
    ]);

    // Quotation 2: APPROVED & DISPATCHED order
    // Seller Rahul Sharma, Buyer MedPlus Pharmacy (Buyer 2)
    const [quoteApproved] = await db.insert(schema.quotations).values({
      sellerId: seller.id,
      buyerId: buyer2.id,
      status: 'approved',
      orderStatus: 'dispatched', // Seed order status dispatched
      totalAmount: '4575.000000',
      notes: 'Allocated compounding stock.',
    }).returning();

    await db.insert(schema.quotationItems).values([
      {
        quotationId: quoteApproved.id,
        productId: n95Masks.id,
        orderedUnit: 'unit',
        orderedQuantity: '100.000000',
        baseQuantity: '100.000000',
        unitPriceAtOrder: '45.000000',
        lineTotal: '4500.000000',
      },
      {
        quotationId: quoteApproved.id,
        productId: salineSol.id,
        orderedUnit: 'mL',
        orderedQuantity: '500.000000',
        baseQuantity: '500.000000',
        unitPriceAtOrder: '0.150000',
        lineTotal: '75.000000',
      }
    ]);

    // 9. Seed Comments Thread
    console.log("Seeding quotation comments...");
    await db.insert(schema.quotationComments).values([
      { quotationId: quotePending.id, userId: seller.id, comment: "Requesting express delivery." },
      { quotationId: quotePending.id, userId: admin.id, comment: "Approved for transit, but please confirm the safety certificate details." }
    ]);

    // 10. Seed Notifications
    console.log("Seeding notifications...");
    await db.insert(schema.notifications).values([
      { userId: buyer2.id, title: "Order Shipped", message: `Your quotation request #${quoteApproved.id.substring(0,8).toUpperCase()} has been dispatched.`, isRead: false },
      { userId: seller.id, title: "Quotation Pending Approval", message: `New quotation submitted for Apollo Pharmacy.`, isRead: false },
    ]);

    // 11. Seed Audit Logs
    console.log("Seeding audit logs...");
    await db.insert(schema.auditLogs).values([
      { userId: admin.id, action: 'USER_ROLE_SEED', details: JSON.stringify({ message: "Seeded initial B2B users and configurations." }) },
      { userId: seller.id, action: 'PRODUCT_CREATED', details: JSON.stringify({ productId: paraPow.id, sku: paraPow.sku }) },
      { userId: admin.id, action: 'QUOTATION_STATUS_CHANGE', details: JSON.stringify({ quotationId: quoteApproved.id, status: 'approved' }) }
    ]);

    console.log("Database seeding completed successfully!");
  } catch (err) {
    console.error("Error during database seeding:", err);
    process.exit(1);
  }
}

seed();
