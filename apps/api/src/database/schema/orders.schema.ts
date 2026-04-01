import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { coupons } from './config.schema';
import { products, productVariants, stores } from './catalog.schema';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: orderStatusEnum('status').notNull().default('pending'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  shippingCost: numeric('shipping_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  couponId: text('coupon_id').references(() => coupons.id, {
    onDelete: 'set null',
  }),
  shippingMethodId: text('shipping_method_id'),
  shippingAddress: text('shipping_address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  variantId: text('variant_id').references(() => productVariants.id, {
    onDelete: 'restrict',
  }),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  qty: integer('qty').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
