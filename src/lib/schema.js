import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'seller' | 'buyer'
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').unique(),
  category: text('category'),
  baseUnit: text('base_unit').notNull(), // 'g' | 'mL' | 'unit'
  basePricePerUnit: numeric('base_price_per_unit', { precision: 20, scale: 6 }).notNull(),
  stockQuantity: numeric('stock_quantity', { precision: 20, scale: 6 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quotations = pgTable('quotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  totalAmount: numeric('total_amount', { precision: 20, scale: 6 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  orderedUnit: text('ordered_unit').notNull(), // 'g' | 'kg' | 'mL' | 'L' | 'unit'
  orderedQuantity: numeric('ordered_quantity', { precision: 20, scale: 6 }).notNull(),
  baseQuantity: numeric('base_quantity', { precision: 20, scale: 6 }).notNull(),
  unitPriceAtOrder: numeric('unit_price_at_order', { precision: 20, scale: 6 }).notNull(),
  lineTotal: numeric('line_total', { precision: 20, scale: 6 }).notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  quotationsAsSeller: many(quotations, { relationName: 'sellerQuotations' }),
  quotationsAsBuyer: many(quotations, { relationName: 'buyerQuotations' }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  quotationItems: many(quotationItems),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  seller: one(users, {
    fields: [quotations.sellerId],
    references: [users.id],
    relationName: 'sellerQuotations',
  }),
  buyer: one(users, {
    fields: [quotations.buyerId],
    references: [users.id],
    relationName: 'buyerQuotations',
  }),
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
}));
