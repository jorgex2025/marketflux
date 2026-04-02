import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DrizzleService } from '../database/database.module';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import {
  reviews,
  reviewHelpful,
  orders,
  orderItems,
  products,
} from '../database/schema';
import { and, eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly db: DrizzleService,
    @InjectQueue('reputation') private readonly reputationQueue: Queue,
  ) {}

  async listByProduct(
    productId: string,
    rating?: number,
    page = 1,
    limit = 20,
  ) {
    const db = this.db.db;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(reviews.productId, productId),
      eq(reviews.status, 'approved'),
    ];
    if (rating) conditions.push(eq(reviews.rating, rating));

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(reviews)
        .where(and(...conditions))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(and(...conditions)),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: string, dto: CreateReviewDto) {
    const db = this.db.db;

    // 1. Verificar que compró el producto en una orden entregada
    const eligible = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, 'delivered'),
          eq(orderItems.productId, dto.productId),
        ),
      )
      .limit(1);

    if (eligible.length === 0) {
      throw new BadRequestException(
        'Solo puedes reseñar productos de órdenes entregadas',
      );
    }

    // 2. Verificar que no haya reseñado ya este producto (deduplicación)
    const existing = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, userId),
        eq(reviews.productId, dto.productId),
      ),
    });
    if (existing) {
      throw new ConflictException('Ya reseñaste este producto');
    }

    const [review] = await db
      .insert(reviews)
      .values({
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        images: dto.images ?? [],
        status: 'pending',
      })
      .returning();

    return { data: review };
  }

  async update(userId: string, id: string, dto: Partial<CreateReviewDto>) {
    const db = this.db.db;
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    if (!review) throw new NotFoundException('Review no encontrada');
    if (review.userId !== userId) throw new ForbiddenException();
    if (review.status !== 'pending') {
      throw new BadRequestException('Solo se pueden editar reseñas pendientes');
    }

    const { productId: _pid, ...updateFields } = dto;
    const [updated] = await db
      .update(reviews)
      .set({ ...updateFields, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();

    return { data: updated };
  }

  async remove(_adminId: string, id: string) {
    const db = this.db.db;
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    if (!review) throw new NotFoundException('Review no encontrada');

    await db.delete(reviews).where(eq(reviews.id, id));
    return { data: { deleted: true } };
  }

  async addReply(sellerId: string, id: string, dto: ReplyReviewDto) {
    const db = this.db.db;
    const [review] = await db
      .select({ id: reviews.id, productId: reviews.productId })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    if (!review) throw new NotFoundException('Review no encontrada');

    const [product] = await db
      .select({ storeId: products.storeId })
      .from(products)
      .where(eq(products.id, review.productId))
      .limit(1);
    if (!product) throw new NotFoundException('Producto no encontrado');

    const { stores } = await import('../database/schema');
    const [store] = await db
      .select({ userId: stores.userId })
      .from(stores)
      .where(eq(stores.id, product.storeId))
      .limit(1);

    if (!store || store.userId !== sellerId) {
      throw new ForbiddenException('No eres el dueño de este producto');
    }

    const [updated] = await db
      .update(reviews)
      .set({
        sellerReply: dto.reply,
        sellerReplyAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    return { data: updated };
  }

  async toggleHelpful(userId: string, id: string) {
    const db = this.db.db;
    const [existing] = await db
      .select()
      .from(reviewHelpful)
      .where(
        and(eq(reviewHelpful.reviewId, id), eq(reviewHelpful.userId, userId)),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(reviewHelpful)
        .where(
          and(
            eq(reviewHelpful.reviewId, id),
            eq(reviewHelpful.userId, userId),
          ),
        );
      return { data: { helpful: false } };
    }

    await db.insert(reviewHelpful).values({ reviewId: id, userId });
    return { data: { helpful: true } };
  }

  async listPending(page = 1, limit = 20) {
    const db = this.db.db;
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(reviews)
        .where(eq(reviews.status, 'pending'))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.status, 'pending')),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async moderate(adminId: string, id: string, dto: ModerateReviewDto) {
    const db = this.db.db;
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    if (!review) throw new NotFoundException('Review no encontrada');

    const [updated] = await db
      .update(reviews)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();

    if (dto.status === 'approved') {
      await this.reputationQueue.add('recalculate', {
        productId: review.productId,
      });
    }

    return { data: updated };
  }
}
