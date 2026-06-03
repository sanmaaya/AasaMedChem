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
    // 1. Clean existing records
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
      },
      {
        email: 'seller@aasa.com',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        name: 'Rahul Sharma (Seller Agent)',
      },
      {
        email: 'buyer@aasa.com',
        passwordHash: buyerPasswordHash,
        role: 'buyer',
        name: 'Apollo Pharmacy Delhi (Buyer)',
      },
      {
        email: 'buyer2@aasa.com',
        passwordHash: buyerPasswordHash,
        role: 'buyer',
        name: 'MedPlus Pharmacy Gurgaon (Buyer 2)',
      },
    ]).returning();

    console.log(`Seeded users: 
      - Admin: ${admin.email} (ID: ${admin.id})
      - Seller: ${seller.email} (ID: ${seller.id})
      - Buyer 1: ${buyer1.email} (ID: ${buyer1.id})
      - Buyer 2: ${buyer2.email} (ID: ${buyer2.id})`);

    // 4. Insert products
    console.log("Inserting products...");
    const seededProducts = await db.insert(schema.products).values([
      {
        name: 'Paracetamol Powder',
        sku: 'PARA-POW-100',
        category: 'Active Ingredients',
        description: 'Raw pharmaceutical grade Paracetamol powder. High purity active ingredient.',
        baseUnit: 'g',
        basePricePerUnit: '0.050000', // ₹0.05 per gram (or ₹50 per kg)
        stockQuantity: '100000.000000', // 100 kg (100,000 g)
        isActive: true,
      },
      {
        name: 'Saline Solution Sol-A',
        sku: 'SALI-SOL-500',
        category: 'Fluids',
        description: 'Sterile saline solution for compounding and infusion prep.',
        baseUnit: 'mL',
        basePricePerUnit: '0.150000', // ₹0.15 per mL (or ₹150 per L)
        stockQuantity: '50000.000000', // 50 L (50,000 mL)
        isActive: true,
      },
      {
        name: 'N95 Respirator Masks',
        sku: 'MASK-N95-001',
        category: 'Consumables',
        description: 'Standard protective N95 facial respirator mask (individual pack).',
        baseUnit: 'unit',
        basePricePerUnit: '45.000000', // ₹45 per unit
        stockQuantity: '1200.000000', // 1,200 units
        isActive: true,
      },
      {
        name: 'Amoxicillin Trihydrate',
        sku: 'AMOX-TRI-250',
        category: 'Antibiotics',
        description: 'Amoxicillin pharmaceutical grade material in powder form.',
        baseUnit: 'g',
        basePricePerUnit: '0.120000', // ₹0.12 per gram (or ₹120 per kg)
        stockQuantity: '50000.000000', // 50 kg (50,000 g)
        isActive: true,
      },
      {
        name: 'Isopropyl Alcohol 99%',
        sku: 'IPA-99-1000',
        category: 'Solvents',
        description: 'Compounding grade 99% pure Isopropyl Alcohol solvent.',
        baseUnit: 'mL',
        basePricePerUnit: '0.080000', // ₹0.08 per mL (or ₹80 per L)
        stockQuantity: '80000.000000', // 80 L (80,000 mL)
        isActive: true,
      },
    ]).returning();

    console.log(`Seeded ${seededProducts.length} products successfully.`);
    console.log("Database seeding completed successfully!");
  } catch (err) {
    console.error("Error during database seeding:", err);
    process.exit(1);
  }
}

seed();
