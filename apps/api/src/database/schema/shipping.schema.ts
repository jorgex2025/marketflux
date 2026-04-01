import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'shipped',
  'in_transit',
  'delivered',
  'returned',
]);

export const shippingZones = pgTable('shipping_zones', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  countries: jsonb('countries').$type<string[]>().notNull().default([]),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const shippingMethods = pgTable('shipping_methods', {
  id: text('id').primaryKey(),
  zoneId: text('zone_id')
    .notNull()
    .references(() => shippingZones.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  carrier: text('carrier'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  freeAbove: numeric('free_above', { precision: 10, scale: 2 }),
  estimatedDays: text('estimated_days'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  status: shipmentStatusEnum('status').notNull().default('pending'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
