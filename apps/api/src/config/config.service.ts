import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../drizzle/drizzle.provider';
import { REDIS } from '../redis/redis.provider';
import Redis from 'ioredis';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const CACHE_TTL_SECONDS = 300;
const CACHE_PREFIX = 'mf:config:';

@Injectable()
export class MarketplaceConfigService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async getAll(): Promise<Record<string, string>> {
    const cacheKey = `${CACHE_PREFIX}all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Record<string, string>;

    const rows = await this.db.select().from(schema.marketplaceConfig);
    const result = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
    return result;
  }

  async get(key: string): Promise<string> {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const [row] = await this.db
      .select()
      .from(schema.marketplaceConfig)
      .where(eq(schema.marketplaceConfig.key, key))
      .limit(1);

    if (!row) throw new NotFoundException(`Config key '${key}' not found`);
    await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, row.value);
    return row.value;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    await this.db
      .insert(schema.marketplaceConfig)
      .values({ key, value, description: description ?? null, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.marketplaceConfig.key,
        set: { value, description: description ?? null, updatedAt: new Date() },
      });
    await this.redis.del(`${CACHE_PREFIX}${key}`, `${CACHE_PREFIX}all`);
  }

  async setBulk(
    entries: Array<{ key: string; value: string; description?: string }>,
  ): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.description);
    }
  }
}
