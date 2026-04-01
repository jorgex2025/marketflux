import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema/index';
import { stores, products, orders, orderItems } from '../database/schema/index';
import { eq, count, avg, sql } from 'drizzle-orm';
import type { UpdateStoreDto } from './dto/update-store.dto';
import type { OnboardingStepDto } from './dto/onboarding-step.dto';

type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class VendorsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: DB) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const query = this.db.select().from(stores);
    const rows = status
      ? await query.where(eq(stores.status, status as 'pending' | 'active' | 'suspended'))
      : await query;
    const sliced = rows.slice(offset, offset + limit);
    return {
      data: sliced,
      meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
    };
  }

  async findBySlug(slug: string) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async findProductsBySlug(slug: string, page = 1, limit = 20) {
    const store = await this.findBySlug(slug);
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.storeId, store.id));
    const sliced = rows.slice((page - 1) * limit, page * limit);
    return {
      data: sliced,
      meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
    };
  }

  async getMyStore(userId: string) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.userId, userId))
      .limit(1);
    if (!store) throw new NotFoundException('Store not found for this user');
    return store;
  }

  async updateMyStore(userId: string, dto: UpdateStoreDto) {
    const store = await this.getMyStore(userId);
    const [updated] = await this.db
      .update(stores)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(stores.id, store.id))
      .returning();
    return updated;
  }

  async getMyStats(userId: string) {
    const store = await this.getMyStore(userId);
    const [totalProducts] = await this.db
      .select({ count: count() })
      .from(products)
      .where(eq(products.storeId, store.id));
    const [totalOrders] = await this.db
      .select({ count: count() })
      .from(orderItems)
      .where(eq(orderItems.storeId, store.id));
    return {
      storeId: store.id,
      slug: store.slug,
      totalProducts: totalProducts?.count ?? 0,
      totalOrderItems: totalOrders?.count ?? 0,
    };
  }

  async handleOnboarding(userId: string, dto: OnboardingStepDto) {
    const [existing] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.userId, userId))
      .limit(1);

    if (dto.step === 1) {
      // step 1: crear o actualizar datos basicos
      if (existing) {
        const [updated] = await this.db
          .update(stores)
          .set({ ...dto.data, updatedAt: new Date() })
          .where(eq(stores.id, existing.id))
          .returning();
        return updated;
      } else {
        const slug = (dto.data as { name?: string }).name
          ?.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') ?? `store-${userId.slice(0, 8)}`;
        const [created] = await this.db
          .insert(stores)
          .values({ userId, slug, ...dto.data })
          .returning();
        return created;
      }
    }

    if (!existing) throw new NotFoundException('Complete step 1 first');

    // steps 2-4: actualizar campos adicionales
    const [updated] = await this.db
      .update(stores)
      .set({ ...dto.data, updatedAt: new Date() })
      .where(eq(stores.id, existing.id))
      .returning();
    return updated;
  }
}
