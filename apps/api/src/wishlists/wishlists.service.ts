import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { wishlists, wishlistItems } from '../database/schema';
import { DrizzleService } from '../database/database.module';

@Injectable()
export class WishlistsService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  async getOrCreate(userId: string) {
    const [existing] = await (this.db as any)
      .select().from(wishlists)
      .where(eq(wishlists.userId, userId))
      .limit(1);

    if (existing) return existing;

    const [wishlist] = await (this.db as any)
      .insert(wishlists)
      .values({ id: createId(), userId })
      .returning();

    return wishlist;
  }

  async addItem(userId: string, productId: string) {
    const wishlist = await this.getOrCreate(userId);

    const [existing] = await (this.db as any)
      .select().from(wishlistItems)
      .where(and(
        eq(wishlistItems.wishlistId, wishlist.id),
        eq(wishlistItems.productId, productId),
      ))
      .limit(1);

    if (existing) return existing;

    const [item] = await (this.db as any)
      .insert(wishlistItems)
      .values({
        id: createId(),
        wishlistId: wishlist.id,
        productId,
      })
      .returning();

    return item;
  }

  async removeItem(userId: string, productId: string): Promise<{ deleted: string }> {
    const wishlist = await this.getOrCreate(userId);

    const [existing] = await (this.db as any)
      .select().from(wishlistItems)
      .where(and(
        eq(wishlistItems.wishlistId, wishlist.id),
        eq(wishlistItems.productId, productId),
      ))
      .limit(1);

    if (!existing) throw new NotFoundException('Producto no encontrado en wishlist');

    await (this.db as any)
      .delete(wishlistItems)
      .where(eq(wishlistItems.id, existing.id));

    return { deleted: productId };
  }

  async list(userId: string) {
    const wishlist = await this.getOrCreate(userId);

    return (this.db as any)
      .select({
        id: wishlistItems.id,
        productId: wishlistItems.productId,
        addedAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .where(eq(wishlistItems.wishlistId, wishlist.id))
      .orderBy(desc(wishlistItems.createdAt));
  }
}
