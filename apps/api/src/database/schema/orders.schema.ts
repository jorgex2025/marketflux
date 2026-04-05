import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';
import { products, productVariants, stores } from './catalog.schema';
import { coupons } from './config.schema';
import { shippingMethods } from './shipping.schema';

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
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  couponId: text('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
  shippingMethodId: text('shipping_method_id').references(() => shippingMethods.id, { onDelete: 'set null' }),
  shippingAddress: text('shipping_address').notNull(),
  billingAddress: text('billing_address'),
  customerNotes: text('customer_notes'),
  paymentMethod: text('payment_method').notNull(),
  paidAt: timestamp('paid_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
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
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  name: text('name').notNull(),
  sku: text('sku'),
  attributes: jsonb('attributes'),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
