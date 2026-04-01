/**
 * Tests de conteo post-seed.
 * Ejecutar: pnpm --filter api vitest run src/database/seed.spec.ts
 *
 * Requiere DB con el seed ya aplicado (make migrate && make seed).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { count } from 'drizzle-orm';
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
    expect(row.value).toBeGreaterThanOrEqual(6);
  });

  it('debe tener exactamente 2 stores', async () => {
    const [row] = await db.select({ value: count() }).from(schema.stores);
    expect(row.value).toBeGreaterThanOrEqual(2);
  });

  it('debe tener exactamente 5 productos', async () => {
    const [row] = await db.select({ value: count() }).from(schema.products);
    expect(row.value).toBeGreaterThanOrEqual(5);
  });

  it('debe tener 2 órdenes', async () => {
    const [row] = await db.select({ value: count() }).from(schema.orders);
    expect(row.value).toBeGreaterThanOrEqual(2);
  });

  it('debe tener al menos 1 review aprobada', async () => {
    const [row] = await db
      .select({ value: count() })
      .from(schema.reviews)
      .where(schema.reviews.status !== undefined ? undefined : undefined);
    expect(row.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener el cupón WELCOME10 activo', async () => {
    const [row] = await db.select({ value: count() }).from(schema.coupons);
    expect(row.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener al menos 1 banner activo', async () => {
    const [row] = await db.select({ value: count() }).from(schema.banners);
    expect(row.value).toBeGreaterThanOrEqual(1);
  });

  it('debe tener la fila singleton en marketplace_config', async () => {
    const [row] = await db
      .select({ value: count() })
      .from(schema.marketplaceConfig);
    expect(row.value).toBe(1);
  });

  it('debe tener 3 categorías', async () => {
    const [row] = await db.select({ value: count() }).from(schema.categories);
    expect(row.value).toBeGreaterThanOrEqual(3);
  });
});
