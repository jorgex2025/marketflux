import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';

export const marketplaceConfig = pgTable('marketplace_config', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const banners = pgTable('banners', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  image: text('image').notNull(),
  url: text('url'),
  position: text('position').notNull().default('hero'),
  active: boolean('active').default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  code: text('code').notNull().unique(),
  type: text('type').notNull().default('percentage'),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 2 }),
  usageLimit: text('usage_limit'),
  usedCount: text('used_count').default('0'),
  active: boolean('active').default(true),
  storeId: text('store_id'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const couponUsage = pgTable('coupon_usage', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  couponId: text('coupon_id')
    .notNull()
    .references(() => coupons.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  orderId: text('order_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wishlists = pgTable('wishlists', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wishlistItems = pgTable('wishlist_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  wishlistId: text('wishlist_id')
    .notNull()
    .references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(),
  generatedBy: text('generated_by').references(() => users.id),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
