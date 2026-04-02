import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../database/database.module';
import {
  sellerReputation,
  reviews,
  orders,
  orderItems,
  disputes,
  stores,
  products,
} from '../database/schema';
import { and, eq, sql, avg, isNotNull } from 'drizzle-orm';

@Injectable()
export class ReputationService {
  constructor(private readonly db: DrizzleService) {}

  async getReputation(sellerId: string) {
    const db = this.db.db;
    const [rep] = await db
      .select()
      .from(sellerReputation)
      .where(eq(sellerReputation.sellerId, sellerId))
      .limit(1);

    if (!rep) throw new NotFoundException('Reputación no encontrada');
    return { data: rep };
  }

  async recalculate(sellerId: string): Promise<void> {
    const db = this.db.db;

    // avgRating: reviews aprobadas de productos del seller
    // sellerId → stores → products → reviews
    const [ratingRow] = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(
        and(
          eq(stores.userId, sellerId),
          eq(reviews.status, 'approved'),
        ),
      );

    const avgRating = Number(ratingRow?.avg ?? 0);

    // Total reviews aprobadas del seller
    const [totalApprovedRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(
        and(
          eq(stores.userId, sellerId),
          eq(reviews.status, 'approved'),
        ),
      );

    // Reviews con respuesta del seller
    const [withReplyRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(
        and(
          eq(stores.userId, sellerId),
          eq(reviews.status, 'approved'),
          isNotNull(reviews.sellerReply),
        ),
      );

    const totalApprovedCount = totalApprovedRow?.count ?? 0;
    const withReplyCount = withReplyRow?.count ?? 0;
    const responseRate = totalApprovedCount > 0 ? withReplyCount / totalApprovedCount : 0;

    // fulfilledOrders: órdenes delivered de compradores de productos del seller
    // Usamos orderItems → products → stores → sellerId
    const [fulfilledRow] = await db
      .select({ count: sql<number>`count(distinct ${orders.id})::int` })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(
        and(
          eq(stores.userId, sellerId),
          eq(orders.status, 'delivered'),
        ),
      );

    const [totalOrdersRow] = await db
      .select({ count: sql<number>`count(distinct ${orders.id})::int` })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(eq(stores.userId, sellerId));

    const fulfilledCount = fulfilledRow?.count ?? 0;
    const totalOrdersCount = totalOrdersRow?.count ?? 0;
    const fulfillmentRate = totalOrdersCount > 0 ? fulfilledCount / totalOrdersCount : 0;

    // disputeCount
    const [disputeRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(disputes)
      .where(eq(disputes.sellerId, sellerId));

    const disputeCount = disputeRow?.count ?? 0;
    const disputePenalty = Math.min(disputeCount * 5, 100);

    const score =
      avgRating * 20 * 0.4 +
      responseRate * 100 * 0.2 +
      fulfillmentRate * 100 * 0.3 -
      disputePenalty * 0.1;

    let badge: 'none' | 'rising' | 'trusted' | 'top_seller' = 'none';
    if (score >= 80 && avgRating >= 4.5) badge = 'top_seller';
    else if (score >= 60 && avgRating >= 4.0) badge = 'trusted';
    else if (score >= 30) badge = 'rising';

    await db
      .insert(sellerReputation)
      .values({
        sellerId,
        avgRating: String(avgRating),
        responseRate: String(responseRate),
        fulfillmentRate: String(fulfillmentRate),
        disputeCount,
        score: String(score),
        badge,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sellerReputation.sellerId,
        set: {
          avgRating: String(avgRating),
          responseRate: String(responseRate),
          fulfillmentRate: String(fulfillmentRate),
          disputeCount,
          score: String(score),
          badge,
          updatedAt: new Date(),
        },
      });
  }
}
