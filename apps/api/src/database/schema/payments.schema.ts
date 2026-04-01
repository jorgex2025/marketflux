import {
  pgTable,
  text,
  timestamp,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { orders, orderItems } from './orders.schema';
import { stores } from './catalog.schema';

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'stripe',
  'mercadopago',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'processing',
  'paid',
  'failed',
]);

export const commissionTypeEnum = pgEnum('commission_type', [
  'global',
  'category',
  'vendor',
]);

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict' }),
  provider: paymentProviderEnum('provider').notNull(),
  externalId: text('external_id'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const commissions = pgTable('commissions', {
  id: text('id').primaryKey(),
  type: commissionTypeEnum('type').notNull().default('global'),
  referenceId: text('reference_id'),
  rate: numeric('rate', { precision: 5, scale: 4 }).notNull(),
  active: text('active').notNull().default('true'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: payoutStatusEnum('status').notNull().default('pending'),
  grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  stripeTransferId: text('stripe_transfer_id'),
  notes: text('notes'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payoutItems = pgTable('payout_items', {
  id: text('id').primaryKey(),
  payoutId: text('payout_id')
    .notNull()
    .references(() => payouts.id, { onDelete: 'cascade' }),
  orderItemId: text('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
