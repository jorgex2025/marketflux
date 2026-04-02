import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';
import { products, productVariants } from './catalog.schema';

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
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  status: orderStatusEnum('status').default('pending').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
  shippingCost: numeric('shipping_cost', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  couponCode: text('coupon_code'),
  shippingAddressId: text('shipping_address_id'),
  shippingMethodId: text('shipping_method_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
