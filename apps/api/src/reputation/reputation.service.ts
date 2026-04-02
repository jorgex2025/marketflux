import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { sellerReputation, stores } from '../database/schema';
import { eq } from 'drizzle-orm';

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

    // Importaciones inline para evitar dependencias circulares
    const { reviews, orders, orderItems, disputes } = await import('../database/schema');
    const { and, eq: eqFn, sql, avg: avgFn, count: countFn } = await import('drizzle-orm');

    // avgRating de reviews aprobadas del seller
    const [ratingRow] = await db
      .select({ avg: avgFn(reviews.rating) })
      .from(reviews)
      .innerJoin(orderItems, eqFn(orderItems.productId, reviews.productId))
      .innerJoin(orders, eqFn(orders.id, orderItems.orderId))
      .where(
        and(
          eqFn(orders.userId, sellerId),
          eqFn(reviews.status, 'approved'),
        ),
      );

    const avgRating = Number(ratingRow?.avg ?? 0);

    // responseRate = reviews con sellerReply / total aprobadas
    const [totalApproved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .innerJoin(orderItems, eqFn(orderItems.productId, reviews.productId))
      .innerJoin(orders, eqFn(orders.id, orderItems.orderId))
      .where(
        and(eqFn(orders.userId, sellerId), eqFn(reviews.status, 'approved')),
      );

    const [withReply] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .innerJoin(orderItems, eqFn(orderItems.productId, reviews.productId))
      .innerJoin(orders, eqFn(orders.id, orderItems.orderId))
      .where(
        and(
          eqFn(orders.userId, sellerId),
          eqFn(reviews.status, 'approved'),
          sql`${reviews.sellerReply} IS NOT NULL`,
        ),
      );

    const totalApprovedCount = Number(totalApproved?.count ?? 0);
    const withReplyCount = Number(withReply?.count ?? 0);
    const responseRate = totalApprovedCount > 0 ? withReplyCount / totalApprovedCount : 0;

    // fulfilledOrders
    const [fulfilledRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(eqFn(orders.userId, sellerId), eqFn(orders.status, 'delivered')));

    const [totalOrdersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eqFn(orders.userId, sellerId));

    const fulfilledCount = Number(fulfilledRow?.count ?? 0);
    const totalOrdersCount = Number(totalOrdersRow?.count ?? 0);
    const fulfillmentRate = totalOrdersCount > 0 ? fulfilledCount / totalOrdersCount : 0;

    // disputeCount
    const [disputeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(disputes)
      .where(eqFn(disputes.sellerId, sellerId));

    const disputeCount = Number(disputeRow?.count ?? 0);
    const disputePenalty = Math.min(disputeCount * 5, 100);

    // Score
    const score =
      avgRating * 20 * 0.4 +
      responseRate * 100 * 0.2 +
      fulfillmentRate * 100 * 0.3 -
      disputePenalty * 0.1;

    // Badge
    let badge: 'none' | 'rising' | 'trusted' | 'top_seller' = 'none';
    if (score >= 80 && avgRating >= 4.5) badge = 'top_seller';
    else if (score >= 60 && avgRating >= 4.0) badge = 'trusted';
    else if (score >= 30) badge = 'rising';

    await db
      .insert(sellerReputation)
      .values({
        sellerId,
        avgRating,
        responseRate,
        fulfillmentRate,
        disputeCount,
        score,
        badge,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sellerReputation.sellerId,
        set: {
          avgRating,
          responseRate,
          fulfillmentRate,
          disputeCount,
          score,
          badge,
          updatedAt: new Date(),
        },
      });
  }
}
