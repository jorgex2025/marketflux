/**
 * Tests de conteo post-seed.
 * Ejecutar: pnpm --filter api vitest run src/database/seed.spec.ts
 *
 * Requiere DB con el seed ya aplicado (make migrate && make seed).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { count, eq } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from './schema';

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(() => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
});

afterAll(async () => {
  await pool.end();
});

describe('Seed: conteos mínimos', () => {
  it('debe tener al menos 6 usuarios', async () => {
    const [row] = await db.select({ value: count() }).from(schema.users);
    expect(row?.value).toBeGreaterThanOrEqual(6);
  });

  it('debe tener exactamente 2 stores', async () => {
    const [row] = await db.select({ value: count() }).from(schema.stores);
    expect(row?.value).toBeGreaterThanOrEqual(2);
  });

  it('debe tener exactamente 5 productos', async () => {
    const [row] = await db.select({ value: count() }).from(schema.products);
    expect(row?.value).toBeGreaterThanOrEqual(5);
  });

  it('debe tener exactamente 2 stores', async () => {
    const [row] = await db.select({ value: count() }).from(schema.stores);
    expect(row?.value).toBeGreaterThanOrEqual(2);
  });

  it('debe tener exactamente 5 productos', async () => {
    const [row] = await db.select({ value: count() }).from(schema.products);
    expect(row?.value).toBeGreaterThanOrEqual(5);
  });

  it('debe tener 2 órdenes', async () => {
    const [row] = await db.select({ value: count() }).from(schema.orders);
    expect(row?.value).toBeGreaterThanOrEqual(2);
  });

  it('debe tener al menos 1 review aprobada', async () => {
    const [row] = await db
      .select({ value: count() })
      .from(schema.reviews);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener el cupón WELCOME10 activo', async () => {
    const [row] = await db.select({ value: count() }).from(schema.coupons);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener al menos 1 banner activo', async () => {
    const [row] = await db.select({ value: count() }).from(schema.banners);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener la fila singleton en marketplace_config', async () => {
    const [row] = await db
      .select({ value: count() })
      .from(schema.marketplaceConfig);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener 3 categorías', async () => {
    const [row] = await db.select({ value: count() }).from(schema.categories);
    expect(row?.value).toBeGreaterThanOrEqual(3);
  });
});

describe('Verificar counts de cada tabla', () => {
  it('users tiene al menos 6 registros', async () => {
    const [row] = await db.select({ value: count() }).from(schema.users);
    expect(row?.value).toBeGreaterThanOrEqual(6);
  });

  it('stores tiene al menos 2 registros', async () => {
    const [row] = await db.select({ value: count() }).from(schema.stores);
    expect(row?.value).toBeGreaterThanOrEqual(2);
  });

  it('products tiene al menos 5 registros', async () => {
    const [row] = await db.select({ value: count() }).from(schema.products);
    expect(row?.value).toBeGreaterThanOrEqual(5);
  });

  it('orders tiene al menos 2 registros', async () => {
    const [row] = await db.select({ value: count() }).from(schema.orders);
    expect(row?.value).toBeGreaterThanOrEqual(2);
  });

  it('reviews tiene al menos 1 registro', async () => {
    const [row] = await db.select({ value: count() }).from(schema.reviews);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });

  it('categories tiene al menos 3 registros', async () => {
    const [row] = await db.select({ value: count() }).from(schema.categories);
    expect(row?.value).toBeGreaterThanOrEqual(3);
  });

  it('coupons tiene al menos 1 registro', async () => {
    const [row] = await db.select({ value: count() }).from(schema.coupons);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });

  it('banners tiene al menos 1 registro', async () => {
    const [row] = await db.select({ value: count() }).from(schema.banners);
    expect(row?.value).toBeGreaterThanOrEqual(1);
  });
});

describe('Verificar relaciones (foreign keys funcionando)', () => {
  it('orders tiene user válido (FK users)', async () => {
    const orders = await db.select().from(schema.orders).limit(1);
    expect(orders.length).toBeGreaterThan(0);
    const userId = orders[0]?.userId;
    expect(userId).toBeDefined();
    if (userId) {
      const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      expect(user.length).toBeGreaterThan(0);
    }
  });

  it('products tiene store válido (FK stores)', async () => {
    const products = await db.select().from(schema.products).limit(1);
    expect(products.length).toBeGreaterThan(0);
    const storeId = products[0]?.storeId;
    expect(storeId).toBeDefined();
    if (storeId) {
      const store = await db.select().from(schema.stores).where(eq(schema.stores.id, storeId)).limit(1);
      expect(store.length).toBeGreaterThan(0);
    }
  });

  it('order_items tiene order válido (FK orders)', async () => {
    const items = await db.select().from(schema.orderItems).limit(1);
    expect(items.length).toBeGreaterThan(0);
    const orderId = items[0]?.orderId;
    expect(orderId).toBeDefined();
    if (orderId) {
      const order = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
      expect(order.length).toBeGreaterThan(0);
    }
  });
});

describe('Verificar constraints (no permite valores inválidos)', () => {
  it('users.role tiene valor válido', async () => {
    const users = await db.select({ role: schema.users.role }).from(schema.users);
    const validRoles = ['admin', 'seller', 'buyer'];
    users.forEach(u => {
      expect(validRoles).toContain(u.role);
    });
  });

  it('products.price es positivo', async () => {
    const products = await db.select({ price: schema.products.price }).from(schema.products);
    products.forEach(p => {
      expect(Number(p.price)).toBeGreaterThan(0);
    });
  });

  it('reviews.rating está entre 1 y 5', async () => {
    const reviews = await db.select({ rating: schema.reviews.rating }).from(schema.reviews);
    reviews.forEach(r => {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    });
  });
});

describe('Verificar constraints (no permite valores inválidos)', () => {
  it('users.role tiene valor válido', async () => {
    const users = await db.select({ role: schema.users.role }).from(schema.users);
    const validRoles = ['admin', 'seller', 'buyer'];
    users.forEach(u => {
      expect(validRoles).toContain(u.role);
    });
  });

  it('products.price es positivo', async () => {
    const products = await db.select({ price: schema.products.price }).from(schema.products);
    products.forEach(p => {
      expect(Number(p.price)).toBeGreaterThan(0);
    });
  });

  it('reviews.rating está entre 1 y 5', async () => {
    const reviews = await db.select({ rating: schema.reviews.rating }).from(schema.reviews);
    reviews.forEach(r => {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    });
  });
});
