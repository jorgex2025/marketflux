import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { orders } from './orders.schema';

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'in_transit',
  'delivered',
  'returned',
]);

export const shippingZones = pgTable('shipping_zones', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  countries: jsonb('countries').$type<string[]>().default([]),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shippingMethods = pgTable('shipping_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  zoneId: text('zone_id').references(() => shippingZones.id),
  name: text('name').notNull(),
  carrier: text('carrier'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  minDays: text('min_days'),
  maxDays: text('max_days'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shipments = pgTable('shipments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  status: shipmentStatusEnum('status').default('pending').notNull(),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
