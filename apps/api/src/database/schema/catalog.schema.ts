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

export const storeStatusEnum = pgEnum('store_status', [
  'pending',
  'active',
  'suspended',
]);

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
]);

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  parentId: text('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const categoryAttributes = pgTable('category_attributes', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('text'),
  required: boolean('required').notNull().default(false),
  options: jsonb('options'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  status: storeStatusEnum('status').notNull().default('pending'),
  stripeAccountId: text('stripe_account_id'),
  onboardingStep: integer('onboarding_step').notNull().default(0),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  country: text('country').notNull().default('CO'),
  currency: text('currency').notNull().default('COP'),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  comparePrice: numeric('compare_price', { precision: 12, scale: 2 }),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  attributes: jsonb('attributes'),
  status: productStatusEnum('status').notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  stock: integer('stock').notNull().default(0),
  sku: text('sku'),
  weight: numeric('weight', { precision: 8, scale: 3 }),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  price: numeric('price', { precision: 12, scale: 2 }),
  stock: integer('stock').notNull().default(0),
  attributes: jsonb('attributes'),
  imageUrl: text('image_url'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
