import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import { products, stores } from './catalog.schema';
import { orders, orderItems } from './orders.schema';

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'approved',
  'rejected',
]);

export const returnStatusEnum = pgEnum('return_status', [
  'requested',
  'approved',
  'rejected',
  'refunded',
]);

export const returnReasonEnum = pgEnum('return_reason', [
  'defective',
  'wrong_item',
  'not_as_described',
  'changed_mind',
  'other',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved',
  'closed',
]);

export const badgeEnum = pgEnum('reputation_badge', [
  'none',
  'rising',
  'trusted',
  'top_seller',
]);

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict' }),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  images: text('images'),
  status: reviewStatusEnum('status').notNull().default('pending'),
  sellerReply: text('seller_reply'),
  sellerReplyAt: timestamp('seller_reply_at'),
  moderatedBy: text('moderated_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  moderatedAt: timestamp('moderated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const reviewHelpful = pgTable(
  'review_helpful',
  {
    id: text('id').primaryKey(),
    reviewId: text('review_id')
      .notNull()
      .references(() => reviews.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique('review_helpful_unique').on(t.reviewId, t.userId)],
);

export const sellerReputation = pgTable('seller_reputation', {
  id: text('id').primaryKey(),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 })
    .notNull()
    .default('0'),
  responseRate: numeric('response_rate', { precision: 5, scale: 4 })
    .notNull()
    .default('0'),
  avgResponseH: numeric('avg_response_h', { precision: 8, scale: 2 })
    .notNull()
    .default('0'),
  fulfilledOrders: integer('fulfilled_orders').notNull().default(0),
  disputeCount: integer('dispute_count').notNull().default(0),
  score: numeric('score', { precision: 5, scale: 2 }).notNull().default('0'),
  badge: badgeEnum('badge').notNull().default('none'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const returns = pgTable('returns', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict' }),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  reason: returnReasonEnum('reason').notNull(),
  description: text('description'),
  evidence: text('evidence'),
  status: returnStatusEnum('status').notNull().default('requested'),
  rejectionReason: text('rejection_reason'),
  stripeRefundId: text('stripe_refund_id'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const returnItems = pgTable('return_items', {
  id: text('id').primaryKey(),
  returnId: text('return_id')
    .notNull()
    .references(() => returns.id, { onDelete: 'cascade' }),
  orderItemId: text('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'restrict' }),
  qty: integer('qty').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const disputes = pgTable('disputes', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict' }),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  reason: text('reason').notNull(),
  description: text('description'),
  evidence: text('evidence'),
  status: disputeStatusEnum('status').notNull().default('open'),
  resolution: text('resolution'),
  resolvedBy: text('resolved_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
