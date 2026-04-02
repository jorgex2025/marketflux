import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';
import { products } from './catalog.schema';
import { orders } from './orders.schema';

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'approved',
  'rejected',
]);

export const returnStatusEnum = pgEnum('return_status', [
  'pending',
  'approved',
  'rejected',
  'refunded',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved',
  'closed',
]);

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  images: jsonb('images').$type<string[]>().default([]),
  status: reviewStatusEnum('status').default('pending').notNull(),
  sellerReply: text('seller_reply'),
  sellerReplyAt: timestamp('seller_reply_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reviewHelpful = pgTable(
  'review_helpful',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    reviewId: text('review_id')
      .notNull()
      .references(() => reviews.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueReviewUser: uniqueIndex('review_helpful_review_user_idx').on(
      table.reviewId,
      table.userId,
    ),
  }),
);

export const sellerReputation = pgTable('seller_reputation', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).default('0'),
  responseRate: numeric('response_rate', { precision: 5, scale: 4 }).default('0'),
  fulfillmentRate: numeric('fulfillment_rate', { precision: 5, scale: 4 }).default('0'),
  disputeCount: integer('dispute_count').default(0),
  score: numeric('score', { precision: 6, scale: 2 }).default('0'),
  badge: text('badge').default('none').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const returns = pgTable('returns', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  reason: text('reason').notNull(),
  description: text('description'),
  evidence: jsonb('evidence').$type<string[]>().default([]),
  status: returnStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const returnItems = pgTable('return_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  returnId: text('return_id')
    .notNull()
    .references(() => returns.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const disputes = pgTable('disputes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id),
  reason: text('reason').notNull(),
  description: text('description'),
  evidence: jsonb('evidence').$type<string[]>().default([]),
  status: disputeStatusEnum('status').default('open').notNull(),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
