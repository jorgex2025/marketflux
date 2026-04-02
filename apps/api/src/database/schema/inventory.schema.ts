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
import { orders } from './orders.schema';

export const reservationStatusEnum = pgEnum('reservation_status', [
  'reserved',
  'confirmed',
  'released',
]);

export const inventoryReservations = pgTable('inventory_reservations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  orderId: text('order_id').references(() => orders.id),
  quantity: integer('quantity').notNull(),
  status: reservationStatusEnum('status').default('reserved').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inventoryAlerts = pgTable('inventory_alerts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  threshold: integer('threshold').notNull().default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const carts = pgTable('carts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  couponCode: text('coupon_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  cartId: text('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
