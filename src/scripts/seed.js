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
    await db.delete(schema.quotationItems);
    await db.delete(schema.quotations);
    await db.delete(schema.products);
    await db.delete(schema.users);
    console.log("Database cleaned.");

    // 2. Hash passwords
    console.log("Hashing passwords...");
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const sellerPasswordHash = await bcrypt.hash('seller123', 10);
    const buyerPasswordHash = await bcrypt.hash('buyer123', 10);

    // 3. Insert users
    console.log("Inserting users...");
    const [admin, seller, buyer1, buyer2] = await db.insert(schema.users).values([
      {
        email: 'admin@aasa.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        name: 'AASA System Administrator',
        businessInfo: null,
      },
      {
        email: 'seller@aasa.com',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        name: 'Rahul Sharma (Seller Agent)',
        businessInfo: JSON.stringify({
          businessName: "Aasa MedChem Retailers Ltd.",
          licenseNumber: "LIC-MED-772911",
          notes: "Designated default wholesale agent."
        }),
      },
      {
        email: 'buyer@aasa.com',
        passwordHash: buyerPasswordHash,
        role: 'buyer',
        name: 'Apollo Pharmacy Delhi (Buyer)',
        businessInfo: null,
      },
      {
        email: 'buyer2@aasa.com',
        passwordHash: buyerPasswordHash,
        role: 'buyer',
        name: 'MedPlus Pharmacy Gurgaon (Buyer 2)',
        businessInfo: null,
      },
    ]).returning();

    console.log(`Seeded users: 
      - Admin: ${admin.email} (ID: ${admin.id})
      - Seller: ${seller.email} (ID: ${seller.id})
      - Buyer 1: ${buyer1.email} (ID: ${buyer1.id})
      - Buyer 2: ${buyer2.email} (ID: ${buyer2.id})`);

    // 4. Insert products
    // (Note: stock quantities for N95 Masks and Saline are adjusted down to reflect the approved quotation seeded below)
    console.log("Inserting products...");
    const [paraPow, salineSol, n95Masks, amoxTri, ipaSolvent] = await db.insert(schema.products).values([
      {
        name: 'Paracetamol Powder',
        sku: 'PARA-POW-100',
        category: 'Active Ingredients',
        description: 'Raw pharmaceutical grade Paracetamol powder. High purity active ingredient.',
        baseUnit: 'g',
        basePricePerUnit: '0.050000', // ₹0.05 per gram (or ₹50 per kg)
        stockQuantity: '100000.000000', // 100 kg
        isActive: true,
      },
      {
        name: 'Saline Solution Sol-A',
        sku: 'SALI-SOL-500',
        category: 'Fluids',
        description: 'Sterile saline solution for compounding and infusion prep.',
        baseUnit: 'mL',
        basePricePerUnit: '0.150000', // ₹0.15 per mL (or ₹150 per L)
        stockQuantity: '49500.000000', // 49.5 L (50,000 mL minus 500 mL approved in quote 2)
        isActive: true,
      },
      {
        name: 'N95 Respirator Masks',
        sku: 'MASK-N95-001',
        category: 'Consumables',
        description: 'Standard protective N95 facial respirator mask (individual pack).',
        baseUnit: 'unit',
        basePricePerUnit: '45.000000', // ₹45 per unit
        stockQuantity: '1100.000000', // 1,100 units (1,200 minus 100 approved in quote 2)
        isActive: true,
      },
      {
        name: 'Amoxicillin Trihydrate',
        sku: 'AMOX-TRI-250',
        category: 'Antibiotics',
        description: 'Amoxicillin pharmaceutical grade material in powder form.',
        baseUnit: 'g',
        basePricePerUnit: '0.120000', // ₹0.12 per gram (or ₹120 per kg)
        stockQuantity: '50000.000000', // 50 kg
        isActive: true,
      },
      {
        name: 'Isopropyl Alcohol 99%',
        sku: 'IPA-99-1000',
        category: 'Solvents',
        description: 'Compounding grade 99% pure Isopropyl Alcohol solvent.',
        baseUnit: 'mL',
        basePricePerUnit: '0.080000', // ₹0.08 per mL (or ₹80 per L)
        stockQuantity: '80000.000000', // 80 L
        isActive: true,
      },
    ]).returning();

    console.log(`Seeded ${[paraPow, salineSol, n95Masks, amoxTri, ipaSolvent].length} products.`);

    // 5. Insert mock quotations to populate dashboard statistics
    console.log("Inserting mock quotations...");

    // Quotation 1: PENDING review
    // Seller Rahul Sharma, Buyer Apollo Pharmacy (Buyer 1)
    const [quotePending] = await db.insert(schema.quotations).values({
      sellerId: seller.id,
      buyerId: buyer1.id,
      status: 'pending',
      totalAmount: '900.000000', // ₹900.00 (₹500 for Paracetamol + ₹400 for IPA)
      notes: 'Requesting express compound delivery and safety certificate.',
    }).returning();

    await db.insert(schema.quotationItems).values([
      {
        quotationId: quotePending.id,
        productId: paraPow.id,
        orderedUnit: 'kg',
        orderedQuantity: '10.000000',
        baseQuantity: '10000.000000', // 10,000 g
        unitPriceAtOrder: '50.000000', // ₹50.00 per kg
        lineTotal: '500.000000',
      },
      {
        quotationId: quotePending.id,
        productId: ipaSolvent.id,
        orderedUnit: 'L',
        orderedQuantity: '5.000000',
        baseQuantity: '5000.000000', // 5,000 mL
        unitPriceAtOrder: '80.000000', // ₹80.00 per L
        lineTotal: '400.000000',
      }
    ]);

    // Quotation 2: APPROVED order
    // Seller Rahul Sharma, Buyer MedPlus Pharmacy (Buyer 2)
    const [quoteApproved] = await db.insert(schema.quotations).values({
      sellerId: seller.id,
      buyerId: buyer2.id,
      status: 'approved',
      totalAmount: '4575.000000', // ₹4,575.00 (₹4,500 for N95 + ₹75 for Saline)
      notes: 'Allocated compounding stock.',
    }).returning();

    await db.insert(schema.quotationItems).values([
      {
        quotationId: quoteApproved.id,
        productId: n95Masks.id,
        orderedUnit: 'unit',
        orderedQuantity: '100.000000',
        baseQuantity: '100.000000',
        unitPriceAtOrder: '45.000000', // ₹45.00 per unit
        lineTotal: '4500.000000',
      },
      {
        quotationId: quoteApproved.id,
        productId: salineSol.id,
        orderedUnit: 'mL',
        orderedQuantity: '500.000000',
        baseQuantity: '500.000000',
        unitPriceAtOrder: '0.150000', // ₹0.15 per mL
        lineTotal: '75.000000',
      }
    ]);

    // Quotation 3: REJECTED order
    // Seller Rahul Sharma, Buyer Apollo Pharmacy (Buyer 1)
    const [quoteRejected] = await db.insert(schema.quotations).values({
      sellerId: seller.id,
      buyerId: buyer1.id,
      status: 'rejected',
      totalAmount: '600.000000', // ₹600.00 (₹600 for Amoxicillin)
      notes: 'Rejected: Outdated company trade license.',
    }).returning();

    await db.insert(schema.quotationItems).values([
      {
        quotationId: quoteRejected.id,
        productId: amoxTri.id,
        orderedUnit: 'kg',
        orderedQuantity: '5.000000',
        baseQuantity: '5000.000000', // 5,000 g
        unitPriceAtOrder: '120.000000', // ₹120.00 per kg
        lineTotal: '600.000000',
      }
    ]);

    console.log("Mock quotations and quotation items seeded successfully!");
    console.log("Database seeding completed successfully!");
  } catch (err) {
    console.error("Error during database seeding:", err);
    process.exit(1);
  }
}

seed();
