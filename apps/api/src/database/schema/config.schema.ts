import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const payoutScheduleEnum = pgEnum('payout_schedule', [
  'weekly',
  'biweekly',
  'monthly',
]);

export const onboardingModeEnum = pgEnum('onboarding_mode', [
  'manual',
  'automatic',
]);

export const bannerPositionEnum = pgEnum('banner_position', [
  'hero',
  'sidebar',
  'footer',
]);

export const couponTypeEnum = pgEnum('coupon_type', [
  'percentage',
  'fixed',
]);

export const reportTypeEnum = pgEnum('report_type', [
  'sales',
  'users',
  'products',
  'commissions',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
]);

export const marketplaceConfig = pgTable('marketplace_config', {
  id: text('id').primaryKey().default('singleton'),
  commissionGlobalRate: numeric('commission_global_rate', {
    precision: 5,
    scale: 4,
  })
    .notNull()
    .default('0.10'),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  reviewAutoApprove: boolean('review_auto_approve').notNull().default(false),
  payoutSchedule: payoutScheduleEnum('payout_schedule')
    .notNull()
    .default('biweekly'),
  vendorOnboardingMode: onboardingModeEnum('vendor_onboarding_mode')
    .notNull()
    .default('manual'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: auditActionEnum('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  payload: jsonb('payload'),
  ip: text('ip'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const banners = pgTable('banners', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  position: bannerPositionEnum('position').notNull().default('hero'),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: couponTypeEnum('type').notNull().default('percentage'),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').notNull().default(0),
  perUserLimit: integer('per_user_limit').notNull().default(1),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdBy: text('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  storeId: text('store_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const couponUsage = pgTable('coupon_usage', {
  id: text('id').primaryKey(),
  couponId: text('coupon_id')
    .notNull()
    .references(() => coupons.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  orderId: text('order_id'),
  usedAt: timestamp('used_at').notNull().defaultNow(),
});

export const wishlists = pgTable('wishlists', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const wishlistItems = pgTable('wishlist_items', {
  id: text('id').primaryKey(),
  wishlistId: text('wishlist_id')
    .notNull()
    .references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  type: reportTypeEnum('type').notNull(),
  generatedBy: text('generated_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  parameters: jsonb('parameters'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
