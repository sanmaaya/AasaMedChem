import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'seller' | 'buyer'
  name: text('name').notNull(),
  phone: text('phone'),
  companyName: text('company_name'),
  businessInfo: text('business_info'), // Business metadata for Sellers
  isSuspended: boolean('is_suspended').default(false).notNull(),
  sellerId: uuid('seller_id').references(() => users.id), // For buyers, links to their assigned Seller Agent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').unique(),
  category: text('category'), // Keeps backward compatibility with seeded strings
  categoryId: uuid('category_id').references(() => categories.id), // Foreign key for managed categories
  baseUnit: text('base_unit').notNull(), // 'g' | 'mL' | 'unit'
  basePricePerUnit: numeric('base_price_per_unit', { precision: 20, scale: 6 }).notNull(),
  stockQuantity: numeric('stock_quantity', { precision: 20, scale: 6 }).notNull(),
  lowStockThreshold: numeric('low_stock_threshold', { precision: 20, scale: 6 }).default('1000.000000').notNull(),
  imageUrl: text('image_url'), // Path to product photograph
  parentProductId: uuid('parent_product_id').references(() => products.id), // For variants, links to parent compound SKU
  isActive: boolean('is_active').default(true).notNull(),
  sellerId: uuid('seller_id').references(() => users.id), // Nullable for system defaults, links to a Seller user
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quotations = pgTable('quotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  orderStatus: text('order_status').default('pending').notNull(), // 'pending' | 'packed' | 'dispatched' | 'delivered'
  totalAmount: numeric('total_amount', { precision: 20, scale: 6 }).notNull(),
  notes: text('notes'),
  expiresAt: timestamp('expires_at', { withTimezone: true }), // Expiry threshold
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

export const stockHistoryLogs = pgTable('stock_history_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  oldStock: numeric('old_stock', { precision: 20, scale: 6 }).notNull(),
  newStock: numeric('new_stock', { precision: 20, scale: 6 }).notNull(),
  changeReason: text('change_reason').notNull(), // 'MANUAL_EDIT' | 'QUOTATION_ALLOCATE' | 'CSV_IMPORT'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id), // Logged-in user who performed action
  action: text('action').notNull(), // e.g. 'PRODUCT_CREATED', 'QUOTATION_APPROVED', etc.
  details: text('details'), // JSON string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quotationComments = pgTable('quotation_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  quotationsAsSeller: many(quotations, { relationName: 'sellerQuotations' }),
  quotationsAsBuyer: many(quotations, { relationName: 'buyerQuotations' }),
  assignedSeller: one(users, {
    fields: [users.sellerId],
    references: [users.id],
    relationName: 'sellerBuyerLink',
  }),
  assignedBuyers: many(users, { relationName: 'sellerBuyerLink' }),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  quotationItems: many(quotationItems),
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  parentProduct: one(products, {
    fields: [products.parentProductId],
    references: [products.id],
    relationName: 'productVariants',
  }),
  variants: many(products, { relationName: 'productVariants' }),
  stockLogs: many(stockHistoryLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
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
  comments: many(quotationComments),
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

export const stockHistoryLogsRelations = relations(stockHistoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [stockHistoryLogs.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [stockHistoryLogs.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const quotationCommentsRelations = relations(quotationComments, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationComments.quotationId],
    references: [quotations.id],
  }),
  user: one(users, {
    fields: [quotationComments.userId],
    references: [users.id],
  }),
}));
