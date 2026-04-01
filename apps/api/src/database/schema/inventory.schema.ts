import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { products, productVariants } from './catalog.schema';
import { orders } from './orders.schema';

export const reservationStatusEnum = pgEnum('reservation_status', [
  'reserved',
  'confirmed',
  'released',
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'active',
  'dismissed',
]);

export const inventoryReservations = pgTable('inventory_reservations', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, {
    onDelete: 'cascade',
  }),
  orderId: text('order_id').references(() => orders.id, {
    onDelete: 'cascade',
  }),
  qty: integer('qty').notNull(),
  status: reservationStatusEnum('status').notNull().default('reserved'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const inventoryAlerts = pgTable('inventory_alerts', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, {
    onDelete: 'cascade',
  }),
  threshold: integer('threshold').notNull().default(5),
  status: alertStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const carts = pgTable('carts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  couponId: text('coupon_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey(),
  cartId: text('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, {
    onDelete: 'cascade',
  }),
  qty: integer('qty').notNull().default(1),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});
