import {
  pgTable,
  text,
  timestamp,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { orders } from './orders.schema';
import { users, } from './auth.schema';
import { stores } from './catalog.schema';

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'mercadopago']);

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  provider: paymentProviderEnum('provider').notNull(),
  externalId: text('external_id'),
  status: paymentStatusEnum('status').default('pending').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('usd').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commissions = pgTable('commissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull().default('global'),
  referenceId: text('reference_id'),
  rate: numeric('rate', { precision: 5, scale: 4 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'paid', 'failed']);

export const payouts = pgTable('payouts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id),
  storeId: text('store_id').references(() => stores.id),
  status: payoutStatusEnum('status').default('pending').notNull(),
  gross: numeric('gross', { precision: 12, scale: 2 }).notNull(),
  commission: numeric('commission', { precision: 12, scale: 2 }).notNull(),
  net: numeric('net', { precision: 12, scale: 2 }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  stripeTransferId: text('stripe_transfer_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payoutItems = pgTable('payout_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  payoutId: text('payout_id')
    .notNull()
    .references(() => payouts.id, { onDelete: 'cascade' }),
  orderId: text('order_id').references(() => orders.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
