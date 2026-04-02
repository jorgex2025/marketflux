import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth.schema';

export const notificationTypeEnum = pgEnum('notification_type', [
  'order_paid',
  'order_shipped',
  'order_delivered',
  'review_received',
  'message_received',
  'dispute_opened',
  'return_requested',
  'payout_processed',
  'low_stock',
]);

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => users.id),
  sellerId: text('seller_id')
    .notNull()
    .references(() => users.id),
  productId: text('product_id'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  attachments: jsonb('attachments').$type<string[]>().default([]),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  data: jsonb('data'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
