/**
 * Seed idempotente para Fase 1.
 * Ejecutar: pnpm --filter api tsx src/database/seed.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

function uid(): string {
  return crypto.randomUUID();
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── marketplace_config ──────────────────────────────────────────────────
  const existing = await db
    .select()
    .from(schema.marketplaceConfig)
    .where(eq(schema.marketplaceConfig.id, 'singleton'));

  if (existing.length === 0) {
    await db.insert(schema.marketplaceConfig).values({
      id: 'singleton',
      commissionGlobalRate: '0.10',
      maintenanceMode: false,
      reviewAutoApprove: false,
      payoutSchedule: 'biweekly',
      vendorOnboardingMode: 'manual',
    });
    console.log('  ✓ marketplace_config insertado');
  } else {
    console.log('  · marketplace_config ya existe, omitiendo');
  }

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const userSeeds = [
    { id: 'user-admin-1', name: 'Admin Principal', email: 'admin@marketplace.dev', role: 'admin' as const, emailVerified: true },
    { id: 'user-seller-1', name: 'Seller Uno', email: 'seller1@marketplace.dev', role: 'seller' as const, emailVerified: true },
    { id: 'user-seller-2', name: 'Seller Dos', email: 'seller2@marketplace.dev', role: 'seller' as const, emailVerified: true },
    { id: 'user-buyer-1', name: 'Buyer Uno', email: 'buyer1@marketplace.dev', role: 'buyer' as const, emailVerified: true },
    { id: 'user-buyer-2', name: 'Buyer Dos', email: 'buyer2@marketplace.dev', role: 'buyer' as const, emailVerified: true },
    { id: 'user-buyer-3', name: 'Buyer Tres', email: 'buyer3@marketplace.dev', role: 'buyer' as const, emailVerified: true },
  ];

  for (const u of userSeeds) {
    const found = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, u.id));
    if (found.length === 0) {
      await db.insert(schema.users).values(u);
      console.log(`  ✓ user: ${u.email}`);
    }
  }

  // ── Stores ────────────────────────────────────────────────────────────────
  const storeSeeds = [
    { id: 'store-1', ownerId: 'user-seller-1', name: 'TechStore', slug: 'techstore', status: 'active' as const, onboardingCompleted: true, country: 'CO', currency: 'COP' },
    { id: 'store-2', ownerId: 'user-seller-2', name: 'FashionHub', slug: 'fashionhub', status: 'active' as const, onboardingCompleted: true, country: 'CO', currency: 'COP' },
  ];

  for (const s of storeSeeds) {
    const found = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.id, s.id));
    if (found.length === 0) {
      await db.insert(schema.stores).values(s);
      console.log(`  ✓ store: ${s.name}`);
    }
  }

  // ── Categorías ────────────────────────────────────────────────────────────
  const catSeeds = [
    { id: 'cat-electronica', name: 'Electrónica', slug: 'electronica', parentId: null },
    { id: 'cat-celulares', name: 'Celulares', slug: 'celulares', parentId: 'cat-electronica' },
    { id: 'cat-ropa', name: 'Ropa', slug: 'ropa', parentId: null },
  ];

  for (const c of catSeeds) {
    const found = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, c.id));
    if (found.length === 0) {
      await db.insert(schema.categories).values(c);
      console.log(`  ✓ category: ${c.name}`);
    }
  }

  // ── Productos ─────────────────────────────────────────────────────────────
  const productSeeds = [
    { id: 'prod-1', storeId: 'store-1', categoryId: 'cat-celulares', sellerId: 'user-seller-1', name: 'Smartphone A1', slug: 'smartphone-a1', price: '799000', status: 'active' as const, stock: 20 },
    { id: 'prod-2', storeId: 'store-1', categoryId: 'cat-electronica', sellerId: 'user-seller-1', name: 'Tablet Pro', slug: 'tablet-pro', price: '1200000', status: 'active' as const, stock: 10 },
    { id: 'prod-3', storeId: 'store-1', categoryId: 'cat-electronica', sellerId: 'user-seller-1', name: 'Audífonos BT', slug: 'audifonos-bt', price: '150000', status: 'active' as const, stock: 50 },
    { id: 'prod-4', storeId: 'store-2', categoryId: 'cat-ropa', sellerId: 'user-seller-2', name: 'Camiseta Basic', slug: 'camiseta-basic', price: '45000', status: 'active' as const, stock: 100 },
    { id: 'prod-5', storeId: 'store-2', categoryId: 'cat-ropa', sellerId: 'user-seller-2', name: 'Jean Slim', slug: 'jean-slim', price: '95000', status: 'active' as const, stock: 60 },
  ];

  for (const p of productSeeds) {
    const found = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, p.id));
    if (found.length === 0) {
      await db.insert(schema.products).values(p);
      console.log(`  ✓ product: ${p.name}`);
    }
  }

  // ── Órdenes ───────────────────────────────────────────────────────────────
  const orderSeeds = [
    {
      id: 'order-1',
      buyerId: 'user-buyer-1',
      status: 'paid' as const,
      subtotal: '799000',
      discount: '0',
      shippingCost: '10000',
      total: '809000',
    },
    {
      id: 'order-2',
      buyerId: 'user-buyer-2',
      status: 'delivered' as const,
      subtotal: '45000',
      discount: '0',
      shippingCost: '5000',
      total: '50000',
    },
  ];

  for (const o of orderSeeds) {
    const found = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, o.id));
    if (found.length === 0) {
      await db.insert(schema.orders).values(o);
      console.log(`  ✓ order: ${o.id} (${o.status})`);
    }
  }

  // ── Order Items ───────────────────────────────────────────────────────────
  const orderItemSeeds = [
    {
      id: 'oi-1',
      orderId: 'order-1',
      productId: 'prod-1',
      storeId: 'store-1',
      sellerId: 'user-seller-1',
      name: 'Smartphone A1',
      price: '799000',
      qty: 1,
      subtotal: '799000',
      commissionRate: '0.10',
      commissionAmount: '79900',
    },
    {
      id: 'oi-2',
      orderId: 'order-2',
      productId: 'prod-4',
      storeId: 'store-2',
      sellerId: 'user-seller-2',
      name: 'Camiseta Basic',
      price: '45000',
      qty: 1,
      subtotal: '45000',
      commissionRate: '0.10',
      commissionAmount: '4500',
    },
  ];

  for (const oi of orderItemSeeds) {
    const found = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.id, oi.id));
    if (found.length === 0) {
      await db.insert(schema.orderItems).values(oi);
      console.log(`  ✓ orderItem: ${oi.id}`);
    }
  }

  // ── Review aprobada (orden-2 delivered) ──────────────────────────────────
  const reviewFound = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.id, 'review-1'));
  if (reviewFound.length === 0) {
    await db.insert(schema.reviews).values({
      id: 'review-1',
      productId: 'prod-4',
      buyerId: 'user-buyer-2',
      orderId: 'order-2',
      rating: 5,
      title: 'Excelente calidad',
      body: 'La camiseta llegó perfecta, muy cómoda.',
      status: 'approved',
    });
    console.log('  ✓ review aprobada insertada');
  }

  // ── Cupón activo ──────────────────────────────────────────────────────────
  const couponFound = await db
    .select()
    .from(schema.coupons)
    .where(eq(schema.coupons.code, 'WELCOME10'));
  if (couponFound.length === 0) {
    await db.insert(schema.coupons).values({
      id: 'coupon-1',
      code: 'WELCOME10',
      type: 'percentage',
      value: '10',
      active: true,
    });
    console.log('  ✓ cupón WELCOME10 insertado');
  }

  // ── Banner activo ─────────────────────────────────────────────────────────
  const bannerFound = await db
    .select()
    .from(schema.banners)
    .where(eq(schema.banners.id, 'banner-1'));
  if (bannerFound.length === 0) {
    await db.insert(schema.banners).values({
      id: 'banner-1',
      title: 'Bienvenido a MarketFlux',
      imageUrl: 'https://placehold.co/1200x400',
      position: 'hero',
      active: true,
    });
    console.log('  ✓ banner hero insertado');
  }

  console.log('\n✅ Seed completado correctamente.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed falló:', err);
  process.exit(1);
});
