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
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';

export const storeStatusEnum = pgEnum('store_status', ['active', 'pending', 'suspended']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: text('parent_id'),
  image: text('image'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categoryAttributes = pgTable('category_attributes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('text'),
  options: jsonb('options'),
  required: boolean('required').default(false),
});

export const stores = pgTable('stores', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  banner: text('banner'),
  status: storeStatusEnum('status').default('pending').notNull(),
  stripeAccountId: text('stripe_account_id'),
  onboardingStep: integer('onboarding_step').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  images: jsonb('images').$type<string[]>().default([]),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  comparePrice: numeric('compare_price', { precision: 12, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  sku: text('sku'),
  status: productStatusEnum('status').default('draft').notNull(),
  featured: boolean('featured').default(false),
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  price: numeric('price', { precision: 12, scale: 2 }),
  stock: integer('stock').default(0).notNull(),
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
