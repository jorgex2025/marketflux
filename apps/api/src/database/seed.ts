import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { createId } from '@paralleldrive/cuid2';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export async function seed() {
  console.log('🌱 Starting seed...');

  // ── 1. Users (1 admin, 2 sellers, 3 buyers) ──────────────────────────────
  const userId = {
    admin:   createId(),
    seller1: createId(),
    seller2: createId(),
    buyer1:  createId(),
    buyer2:  createId(),
    buyer3:  createId(),
  };

  await db.insert(schema.users).values([
    { id: userId.admin,   name: 'Admin User',    email: 'admin@marketflux.dev',   role: 'admin',  emailVerified: true },
    { id: userId.seller1, name: 'Seller One',    email: 'seller1@marketflux.dev', role: 'seller', emailVerified: true },
    { id: userId.seller2, name: 'Seller Two',    email: 'seller2@marketflux.dev', role: 'seller', emailVerified: true },
    { id: userId.buyer1,  name: 'Buyer One',     email: 'buyer1@marketflux.dev',  role: 'buyer',  emailVerified: true },
    { id: userId.buyer2,  name: 'Buyer Two',     email: 'buyer2@marketflux.dev',  role: 'buyer',  emailVerified: true },
    { id: userId.buyer3,  name: 'Buyer Three',   email: 'buyer3@marketflux.dev',  role: 'buyer',  emailVerified: true },
  ]).onConflictDoNothing();

  // ── 2. Stores ─────────────────────────────────────────────────────────────
  const storeId = { s1: createId(), s2: createId() };

  await db.insert(schema.stores).values([
    {
      id: storeId.s1,
      userId: userId.seller1,
      name: 'TechZone Store',
      slug: 'techzone-store',
      description: 'Los mejores gadgets y electrónica',
      status: 'active',
    },
    {
      id: storeId.s2,
      userId: userId.seller2,
      name: 'Fashion Hub',
      slug: 'fashion-hub',
      description: 'Moda contemporánea y accesorios',
      status: 'active',
    },
  ]).onConflictDoNothing();

  // ── 3. Categories (jerarquía: Electrónica → Celulares, Ropa) ─────────────
  const catId = { electronica: createId(), celulares: createId(), ropa: createId() };

  await db.insert(schema.categories).values([
    { id: catId.electronica, name: 'Electrónica',  slug: 'electronica',  parentId: null,              position: 1 },
    { id: catId.celulares,   name: 'Celulares',    slug: 'celulares',    parentId: catId.electronica, position: 1 },
    { id: catId.ropa,        name: 'Ropa',         slug: 'ropa',         parentId: null,              position: 2 },
  ]).onConflictDoNothing();

  // ── 4. Products (5 productos con variantes) ───────────────────────────────
  const prodId = {
    p1: createId(), p2: createId(), p3: createId(),
    p4: createId(), p5: createId(),
  };

  await db.insert(schema.products).values([
    { id: prodId.p1, storeId: storeId.s1, categoryId: catId.celulares, name: 'Smartphone Pro X',  slug: 'smartphone-pro-x',  price: '599.99', stock: 50, status: 'active', featured: true },
    { id: prodId.p2, storeId: storeId.s1, categoryId: catId.celulares, name: 'Tablet Ultra 10',   slug: 'tablet-ultra-10',   price: '399.99', stock: 30, status: 'active', featured: false },
    { id: prodId.p3, storeId: storeId.s1, categoryId: catId.electronica, name: 'Auriculares BT Pro', slug: 'auriculares-bt-pro', price: '89.99', stock: 100, status: 'active', featured: true },
    { id: prodId.p4, storeId: storeId.s2, categoryId: catId.ropa,      name: 'Camiseta Premium',  slug: 'camiseta-premium',  price: '29.99', stock: 200, status: 'active', featured: false },
    { id: prodId.p5, storeId: storeId.s2, categoryId: catId.ropa,      name: 'Jeans Clásicos',    slug: 'jeans-clasicos',    price: '49.99', stock: 150, status: 'active', featured: false },
  ]).onConflictDoNothing();

  // ── 5. Orders (1 paid, 1 delivered) ──────────────────────────────────────
  const orderId = { o1: createId(), o2: createId() };

  await db.insert(schema.orders).values([
    {
      id: orderId.o1,
      userId: userId.buyer1,
      status: 'paid',
      total: '599.99',
      subtotal: '599.99',
      shippingTotal: '0',
      taxTotal: '0',
      discountTotal: '0',
    },
    {
      id: orderId.o2,
      userId: userId.buyer2,
      status: 'delivered',
      total: '89.99',
      subtotal: '89.99',
      shippingTotal: '0',
      taxTotal: '0',
      discountTotal: '0',
    },
  ]).onConflictDoNothing();

  await db.insert(schema.orderItems).values([
    {
      id: createId(),
      orderId: orderId.o1,
      productId: prodId.p1,
      storeId: storeId.s1,
      quantity: 1,
      price: '599.99',
      commissionRate: '0.10',
    },
    {
      id: createId(),
      orderId: orderId.o2,
      productId: prodId.p3,
      storeId: storeId.s1,
      quantity: 1,
      price: '89.99',
      commissionRate: '0.10',
    },
  ]).onConflictDoNothing();

  // ── 6. Review (1 aprobada en orden delivered) ─────────────────────────────
  await db.insert(schema.reviews).values([
    {
      id: createId(),
      productId: prodId.p3,
      userId: userId.buyer2,
      orderId: orderId.o2,
      rating: 5,
      title: 'Excelente calidad',
      body: 'Los auriculares superaron mis expectativas. Sonido cristalino.',
      status: 'approved',
    },
  ]).onConflictDoNothing();

  // ── 7. Coupon (WELCOME10) ─────────────────────────────────────────────────
  await db.insert(schema.coupons).values([
    {
      id: createId(),
      code: 'WELCOME10',
      type: 'percentage',
      value: '10',
      minOrderAmount: '0',
      usageLimit: 1000,
      usageCount: 0,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      isActive: true,
    },
  ]).onConflictDoNothing();

  // ── 8. Banner (hero) ──────────────────────────────────────────────────────
  await db.insert(schema.banners).values([
    {
      id: createId(),
      title: 'Bienvenido a MarketFlux',
      subtitle: 'El mejor marketplace multivendor',
      imageUrl: 'https://placehold.co/1200x400/6366f1/white?text=MarketFlux',
      linkUrl: '/search',
      position: 'hero',
      isActive: true,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      sortOrder: 1,
    },
  ]).onConflictDoNothing();

  // ── 9. MarketplaceConfig ──────────────────────────────────────────────────
  await db.insert(schema.marketplaceConfig).values([
    { key: 'commission_global_rate',  value: '0.10' },
    { key: 'maintenance_mode',        value: 'false' },
    { key: 'review_auto_approve',     value: 'false' },
    { key: 'payout_schedule',         value: 'biweekly' },
    { key: 'vendor_onboarding_mode',  value: 'manual' },
  ]).onConflictDoNothing();

  console.log('✅ Seed completed successfully');
  console.log('   Users: 6 | Stores: 2 | Categories: 3 | Products: 5 | Orders: 2');
}

// Ejecutar si es el entry point directo
seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
