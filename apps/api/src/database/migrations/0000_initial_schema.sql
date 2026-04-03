-- ============================================================
-- MarketFlux — Initial Schema Migration
-- Generated from Drizzle schemas (Fase 1)
-- Run: pnpm --filter api run db:migrate
-- ============================================================

-- ────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('admin','seller','buyer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "store_status" AS ENUM ('active','pending','suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "product_status" AS ENUM ('draft','active','archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "order_status" AS ENUM ('pending','paid','processing','shipped','delivered','cancelled','refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "payment_status" AS ENUM ('pending','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "payment_provider" AS ENUM ('stripe','mercadopago');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "payout_status" AS ENUM ('pending','paid','failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "review_status" AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "return_status" AS ENUM ('pending','approved','rejected','refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "dispute_status" AS ENUM ('open','under_review','resolved','closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 1. AUTH (sin dependencias)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"             text PRIMARY KEY,
  "name"           text NOT NULL,
  "email"          text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false,
  "image"          text,
  "role"           "user_role" DEFAULT 'buyer' NOT NULL,
  "created_at"     timestamp DEFAULT now() NOT NULL,
  "updated_at"     timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id"          text PRIMARY KEY,
  "user_id"     text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token"       text NOT NULL UNIQUE,
  "expires_at"  timestamp NOT NULL,
  "ip_address"  text,
  "user_agent"  text,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "updated_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "accounts" (
  "id"                  text PRIMARY KEY,
  "user_id"             text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider"            text NOT NULL,
  "provider_account_id" text NOT NULL,
  "access_token"        text,
  "refresh_token"       text,
  "expires_at"          timestamp,
  "created_at"          timestamp DEFAULT now() NOT NULL,
  "updated_at"          timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verifications" (
  "id"         text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value"      text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 2. CONFIG (depende de users)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "marketplace_config" (
  "id"         text PRIMARY KEY,
  "key"        text NOT NULL UNIQUE,
  "value"      text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         text PRIMARY KEY,
  "user_id"    text REFERENCES "users"("id"),
  "action"     text NOT NULL,
  "entity"     text NOT NULL,
  "entity_id"  text,
  "before"     jsonb,
  "after"      jsonb,
  "ip_address" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "banners" (
  "id"         text PRIMARY KEY,
  "title"      text NOT NULL,
  "image"      text NOT NULL,
  "url"        text,
  "position"   text DEFAULT 'hero' NOT NULL,
  "active"     boolean DEFAULT true,
  "starts_at"  timestamp,
  "ends_at"    timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coupons" (
  "id"               text PRIMARY KEY,
  "code"             text NOT NULL UNIQUE,
  "type"             text DEFAULT 'percentage' NOT NULL,
  "value"            numeric(10,2) NOT NULL,
  "min_order_amount" numeric(12,2),
  "usage_limit"      text,
  "used_count"       text DEFAULT '0',
  "active"           boolean DEFAULT true,
  "store_id"         text,
  "starts_at"        timestamp,
  "ends_at"          timestamp,
  "created_at"       timestamp DEFAULT now() NOT NULL,
  "updated_at"       timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coupon_usage" (
  "id"         text PRIMARY KEY,
  "coupon_id"  text NOT NULL REFERENCES "coupons"("id"),
  "user_id"    text NOT NULL REFERENCES "users"("id"),
  "order_id"   text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wishlists" (
  "id"         text PRIMARY KEY,
  "user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id"          text PRIMARY KEY,
  "wishlist_id" text NOT NULL REFERENCES "wishlists"("id") ON DELETE CASCADE,
  "product_id"  text NOT NULL,
  "created_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reports" (
  "id"           text PRIMARY KEY,
  "type"         text NOT NULL,
  "generated_by" text REFERENCES "users"("id"),
  "data"         jsonb,
  "created_at"   timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 3. CATALOG (depende de users)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
  "id"          text PRIMARY KEY,
  "name"        text NOT NULL,
  "slug"        text NOT NULL UNIQUE,
  "parent_id"   text,
  "image"       text,
  "description" text,
  "position"    integer DEFAULT 0,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "updated_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "category_attributes" (
  "id"          text PRIMARY KEY,
  "category_id" text NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "name"        text NOT NULL,
  "type"        text DEFAULT 'text' NOT NULL,
  "options"     jsonb,
  "required"    boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "stores" (
  "id"                text PRIMARY KEY,
  "user_id"           text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"              text NOT NULL,
  "slug"              text NOT NULL UNIQUE,
  "description"       text,
  "logo"              text,
  "banner"            text,
  "status"            "store_status" DEFAULT 'pending' NOT NULL,
  "stripe_account_id" text,
  "onboarding_step"   integer DEFAULT 0,
  "created_at"        timestamp DEFAULT now() NOT NULL,
  "updated_at"        timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "products" (
  "id"            text PRIMARY KEY,
  "store_id"      text NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "category_id"   text REFERENCES "categories"("id"),
  "name"          text NOT NULL,
  "slug"          text NOT NULL UNIQUE,
  "description"   text,
  "images"        jsonb DEFAULT '[]',
  "price"         numeric(12,2) NOT NULL,
  "compare_price" numeric(12,2),
  "stock"         integer DEFAULT 0 NOT NULL,
  "sku"           text,
  "status"        "product_status" DEFAULT 'draft' NOT NULL,
  "featured"      boolean DEFAULT false,
  "attributes"    jsonb,
  "created_at"    timestamp DEFAULT now() NOT NULL,
  "updated_at"    timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "product_variants" (
  "id"         text PRIMARY KEY,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "name"       text NOT NULL,
  "sku"        text,
  "price"      numeric(12,2),
  "stock"      integer DEFAULT 0 NOT NULL,
  "attributes" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 4. SHIPPING
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "shipping_zones" (
  "id"         text PRIMARY KEY,
  "name"       text NOT NULL,
  "countries"  jsonb NOT NULL DEFAULT '[]',
  "active"     boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "shipping_methods" (
  "id"              text PRIMARY KEY,
  "zone_id"         text NOT NULL REFERENCES "shipping_zones"("id") ON DELETE CASCADE,
  "name"            text NOT NULL,
  "price"           numeric(12,2) NOT NULL,
  "min_days"        integer,
  "max_days"        integer,
  "free_above"      numeric(12,2),
  "active"          boolean DEFAULT true,
  "created_at"      timestamp DEFAULT now() NOT NULL,
  "updated_at"      timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "shipments" (
  "id"              text PRIMARY KEY,
  "order_id"        text NOT NULL REFERENCES "orders"("id"),
  "tracking_number" text,
  "carrier"         text,
  "status"          text DEFAULT 'pending' NOT NULL,
  "shipped_at"      timestamp,
  "delivered_at"    timestamp,
  "created_at"      timestamp DEFAULT now() NOT NULL,
  "updated_at"      timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 5. ORDERS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "orders" (
  "id"                       text PRIMARY KEY,
  "user_id"                  text NOT NULL REFERENCES "users"("id"),
  "status"                   "order_status" DEFAULT 'pending' NOT NULL,
  "subtotal"                 numeric(12,2) NOT NULL,
  "discount"                 numeric(12,2) DEFAULT '0',
  "shipping_cost"            numeric(12,2) DEFAULT '0',
  "total"                    numeric(12,2) NOT NULL,
  "coupon_code"              text,
  "shipping_address_id"      text,
  "shipping_method_id"       text,
  "notes"                    text,
  "stripe_session_id"        text,
  "stripe_payment_intent_id" text,
  "created_at"               timestamp DEFAULT now() NOT NULL,
  "updated_at"               timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id"              text PRIMARY KEY,
  "order_id"        text NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id"      text NOT NULL REFERENCES "products"("id"),
  "variant_id"      text REFERENCES "product_variants"("id"),
  "quantity"        integer NOT NULL,
  "unit_price"      numeric(12,2) NOT NULL,
  "total"           numeric(12,2) NOT NULL,
  "commission_rate" numeric(5,4) NOT NULL,
  "created_at"      timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 6. PAYMENTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "payments" (
  "id"          text PRIMARY KEY,
  "order_id"    text NOT NULL REFERENCES "orders"("id"),
  "provider"    "payment_provider" NOT NULL,
  "external_id" text,
  "status"      "payment_status" DEFAULT 'pending' NOT NULL,
  "amount"      numeric(12,2) NOT NULL,
  "currency"    text DEFAULT 'usd' NOT NULL,
  "metadata"    text,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "updated_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "commissions" (
  "id"           text PRIMARY KEY,
  "type"         text DEFAULT 'global' NOT NULL,
  "reference_id" text,
  "rate"         numeric(5,4) NOT NULL,
  "created_at"   timestamp DEFAULT now() NOT NULL,
  "updated_at"   timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payouts" (
  "id"                 text PRIMARY KEY,
  "seller_id"          text NOT NULL REFERENCES "users"("id"),
  "store_id"           text REFERENCES "stores"("id"),
  "status"             "payout_status" DEFAULT 'pending' NOT NULL,
  "gross"              numeric(12,2) NOT NULL,
  "commission"         numeric(12,2) NOT NULL,
  "net"                numeric(12,2) NOT NULL,
  "period_start"       timestamp NOT NULL,
  "period_end"         timestamp NOT NULL,
  "stripe_transfer_id" text,
  "notes"              text,
  "created_at"         timestamp DEFAULT now() NOT NULL,
  "updated_at"         timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payout_items" (
  "id"         text PRIMARY KEY,
  "payout_id"  text NOT NULL REFERENCES "payouts"("id") ON DELETE CASCADE,
  "order_id"   text REFERENCES "orders"("id"),
  "amount"     numeric(12,2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 7. INVENTORY
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "inventory_reservations" (
  "id"            text PRIMARY KEY,
  "product_id"    text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id"    text REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "order_id"      text REFERENCES "orders"("id") ON DELETE SET NULL,
  "quantity"      integer NOT NULL,
  "expires_at"    timestamp,
  "created_at"    timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_alerts" (
  "id"         text PRIMARY KEY,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" text REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "threshold"  integer NOT NULL,
  "active"     boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "carts" (
  "id"         text PRIMARY KEY,
  "user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id"         text PRIMARY KEY,
  "cart_id"    text NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" text REFERENCES "product_variants"("id") ON DELETE SET NULL,
  "quantity"   integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 8. REVIEWS / RETURNS / DISPUTES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reviews" (
  "id"              text PRIMARY KEY,
  "user_id"         text NOT NULL REFERENCES "users"("id"),
  "product_id"      text NOT NULL REFERENCES "products"("id"),
  "rating"          integer NOT NULL,
  "title"           text NOT NULL,
  "body"            text NOT NULL,
  "images"          jsonb DEFAULT '[]',
  "status"          "review_status" DEFAULT 'pending' NOT NULL,
  "seller_reply"    text,
  "seller_reply_at" timestamp,
  "created_at"      timestamp DEFAULT now() NOT NULL,
  "updated_at"      timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_helpful" (
  "id"         text PRIMARY KEY,
  "review_id"  text NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "review_helpful_review_user_idx"
  ON "review_helpful" ("review_id", "user_id");

CREATE TABLE IF NOT EXISTS "seller_reputation" (
  "id"               text PRIMARY KEY,
  "seller_id"        text NOT NULL REFERENCES "users"("id") UNIQUE,
  "avg_rating"       numeric(3,2) DEFAULT '0',
  "response_rate"    numeric(5,4) DEFAULT '0',
  "fulfillment_rate" numeric(5,4) DEFAULT '0',
  "dispute_count"    integer DEFAULT 0,
  "score"            numeric(6,2) DEFAULT '0',
  "badge"            text DEFAULT 'none' NOT NULL,
  "updated_at"       timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "returns" (
  "id"          text PRIMARY KEY,
  "order_id"    text NOT NULL REFERENCES "orders"("id"),
  "buyer_id"    text NOT NULL REFERENCES "users"("id"),
  "reason"      text NOT NULL,
  "description" text,
  "evidence"    jsonb DEFAULT '[]',
  "status"      "return_status" DEFAULT 'pending' NOT NULL,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "updated_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "return_items" (
  "id"         text PRIMARY KEY,
  "return_id"  text NOT NULL REFERENCES "returns"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id"),
  "quantity"   integer NOT NULL,
  "reason"     text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "disputes" (
  "id"          text PRIMARY KEY,
  "order_id"    text NOT NULL REFERENCES "orders"("id"),
  "buyer_id"    text NOT NULL REFERENCES "users"("id"),
  "seller_id"   text NOT NULL REFERENCES "users"("id"),
  "reason"      text NOT NULL,
  "description" text,
  "evidence"    jsonb DEFAULT '[]',
  "status"      "dispute_status" DEFAULT 'open' NOT NULL,
  "resolution"  text,
  "created_at"  timestamp DEFAULT now() NOT NULL,
  "updated_at"  timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- 9. CHAT / NOTIFICATIONS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "conversations" (
  "id"          text PRIMARY KEY,
  "buyer_id"    text NOT NULL REFERENCES "users"("id"),
  "seller_id"   text NOT NULL REFERENCES "users"("id"),
  "product_id"  text REFERENCES "products"("id") ON DELETE SET NULL,
  "last_msg_at" timestamp DEFAULT now(),
  "created_at"  timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id"              text PRIMARY KEY,
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id"       text NOT NULL REFERENCES "users"("id"),
  "body"            text NOT NULL,
  "read"            boolean DEFAULT false,
  "created_at"      timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"         text PRIMARY KEY,
  "user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type"       text NOT NULL,
  "title"      text NOT NULL,
  "body"       text,
  "data"       jsonb,
  "read"       boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────────
-- INDEXES (performance)
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_products_store_id"    ON "products" ("store_id");
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_products_status"      ON "products" ("status");
CREATE INDEX IF NOT EXISTS "idx_products_featured"    ON "products" ("featured");
CREATE INDEX IF NOT EXISTS "idx_orders_user_id"       ON "orders"   ("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status"        ON "orders"   ("status");
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_token"       ON "sessions" ("token");
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id"     ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id", "read");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation" ON "messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_product_id"   ON "reviews"  ("product_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity"    ON "audit_logs" ("entity", "entity_id");
