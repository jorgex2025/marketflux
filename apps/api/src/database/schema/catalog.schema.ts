import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';

export const storeStatusEnum = pgEnum('store_status', ['active', 'pending', 'suspended', 'banned']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);

export const categories = pgTable('categories', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  parentId:    text('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
  name:        text('name').notNull(),
  slug:        text('slug').notNull().unique(),
  description: text('description'),
  image:       text('image'),
  level:       integer('level').default(0).notNull(),
  order:       integer('order').default(0).notNull(),
  isActive:    boolean('is_active').default(true).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});

export const categoryAttributes = pgTable('category_attributes', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name:     text('name').notNull(),
  type:     text('type').notNull(),
  options:  jsonb('options'),
  required: boolean('required').default(false),
  order:    integer('order').default(0),
});

export const stores = pgTable('stores', {
  id:                  text('id').primaryKey().$defaultFn(() => createId()),
  userId:              text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name:                text('name').notNull(),
  slug:                text('slug').notNull().unique(),
  description:         text('description'),
  logo:                text('logo'),
  banner:              text('banner'),
  status:              storeStatusEnum('status').default('pending').notNull(),
  stripeAccountId:     text('stripe_account_id').unique(),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id:              text('id').primaryKey().$defaultFn(() => createId()),
  storeId:         text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  categoryId:      text('category_id').references(() => categories.id, { onDelete: 'restrict' }),
  name:            text('name').notNull(),
  slug:            text('slug').notNull().unique(),
  description:     text('description').notNull(),
  price:           numeric('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice:  numeric('compare_at_price', { precision: 10, scale: 2 }),
  cost:            numeric('cost', { precision: 10, scale: 2 }),
  stock:           integer('stock').default(0).notNull(),
  sku:             text('sku').unique(),
  barcode:         text('barcode'),
  images:          text('images').array().default([]),
  attributes:      jsonb('attributes'),
  status:          productStatusEnum('status').default('draft').notNull(),
  featured:        boolean('featured').default(false),
  metaTitle:       text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id:              text('id').primaryKey().$defaultFn(() => createId()),
  productId:       text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  sku:             text('sku').notNull().unique(),
  barcode:         text('barcode'),
  attributes:      jsonb('attributes').notNull(),
  price:           numeric('price', { precision: 10, scale: 2 }),
  compareAtPrice:  numeric('compare_at_price', { precision: 10, scale: 2 }),
  cost:            numeric('cost', { precision: 10, scale: 2 }),
  stock:           integer('stock').default(0).notNull(),
  image:           text('image'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
});
