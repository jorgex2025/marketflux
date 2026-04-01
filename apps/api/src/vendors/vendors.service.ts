import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema/index';
import { stores, products, orderItems } from '../database/schema/index';
import { eq, count } from 'drizzle-orm';
import type { UpdateStoreDto } from './dto/update-store.dto';
import type { OnboardingStepDto } from './dto/onboarding-step.dto';

type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class VendorsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: DB) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const all = status
      ? await this.db
          .select()
          .from(stores)
          .where(eq(stores.status, status as 'pending' | 'active' | 'suspended'))
      : await this.db.select().from(stores);
    const sliced = all.slice(offset, offset + limit);
    return {
      data: sliced,
      meta: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
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
    const all = await this.db
      .select()
      .from(products)
      .where(eq(products.storeId, store.id));
    const sliced = all.slice((page - 1) * limit, page * limit);
    return {
      data: sliced,
      meta: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
    };
  }

  async getMyStore(userId: string) {
    // schema usa ownerId (no userId)
    const [store] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, userId))
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
    const [totalOrderItems] = await this.db
      .select({ count: count() })
      .from(orderItems)
      .where(eq(orderItems.storeId, store.id));
    return {
      storeId: store.id,
      slug: store.slug,
      totalProducts: totalProducts?.count ?? 0,
      totalOrderItems: totalOrderItems?.count ?? 0,
    };
  }

  async handleOnboarding(userId: string, dto: OnboardingStepDto) {
    const [existing] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, userId))
      .limit(1);

    if (dto.step === 1) {
      const name = (dto.data as { name?: string }).name ?? 'Mi Tienda';
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 60);

      if (existing) {
        const [updated] = await this.db
          .update(stores)
          .set({ ...dto.data, onboardingStep: 1, updatedAt: new Date() })
          .where(eq(stores.id, existing.id))
          .returning();
        return updated;
      }
      const [created] = await this.db
        .insert(stores)
        .values({ ownerId: userId, slug: `${slug}-${userId.slice(0, 6)}`, name, onboardingStep: 1 })
        .returning();
      return created;
    }

    if (!existing) throw new NotFoundException('Complete step 1 first');
    const [updated] = await this.db
      .update(stores)
      .set({ ...dto.data, onboardingStep: dto.step, updatedAt: new Date() })
      .where(eq(stores.id, existing.id))
      .returning();
    return updated;
  }
}
