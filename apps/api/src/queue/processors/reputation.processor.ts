import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDrizzle } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq, and, avg, count, sql } from 'drizzle-orm';

export const REPUTATION_QUEUE = 'reputation';

export interface ReputationJobData {
  sellerId: string;
}

type ReputationBadge = 'none' | 'rising' | 'trusted' | 'top_seller';

function calcBadge(score: number, avgRatingVal: number): ReputationBadge {
  if (score >= 80 && avgRatingVal >= 4.5) return 'top_seller';
  if (score >= 60 && avgRatingVal >= 4.0) return 'trusted';
  if (score >= 30) return 'rising';
  return 'none';
}

@Processor(REPUTATION_QUEUE)
export class ReputationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReputationProcessor.name);

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<ReputationJobData>): Promise<void> {
    const { sellerId } = job.data;
    this.logger.log(`Recalculating reputation for seller ${sellerId}`);

    // 1. avgRating — promedio de reviews aprobadas de productos del seller
    const [ratingRow] = await this.db
      .select({ avgRating: avg(schema.reviews.rating) })
      .from(schema.reviews)
      .innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(
        and(
          eq(schema.stores.userId, sellerId),
          eq(schema.reviews.status, 'approved'),
        ),
      );
    const avgRatingVal = parseFloat(ratingRow?.avgRating ?? '0');

    // 2. responseRate — % reviews aprobadas con sellerReply
    const [totalReviewsRow] = await this.db
      .select({ total: count() })
      .from(schema.reviews)
      .innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(
        and(
          eq(schema.stores.userId, sellerId),
          eq(schema.reviews.status, 'approved'),
        ),
      );

    const [repliedRow] = await this.db
      .select({ replied: count() })
      .from(schema.reviews)
      .innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(
        and(
          eq(schema.stores.userId, sellerId),
          eq(schema.reviews.status, 'approved'),
          sql`${schema.reviews.sellerReply} IS NOT NULL`,
        ),
      );

    const totalReviews = Number(totalReviewsRow?.total ?? 0);
    const repliedCount = Number(repliedRow?.replied ?? 0);
    const responseRate = totalReviews > 0 ? repliedCount / totalReviews : 0;

    // 3. fulfillmentRate — órdenes delivered / total órdenes del seller
    const [totalOrdersRow] = await this.db
      .select({ total: count() })
      .from(schema.orders)
      .innerJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(eq(schema.stores.userId, sellerId));

    const [deliveredRow] = await this.db
      .select({ delivered: count() })
      .from(schema.orders)
      .innerJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(
        and(
          eq(schema.stores.userId, sellerId),
          eq(schema.orders.status, 'delivered'),
        ),
      );

    const totalOrders = Number(totalOrdersRow?.total ?? 0);
    const deliveredOrders = Number(deliveredRow?.delivered ?? 0);
    const fulfillmentRate = totalOrders > 0 ? deliveredOrders / totalOrders : 0;

    // 4. disputeCount — disputes tiene sellerId directo
    const [disputeRow] = await this.db
      .select({ dispCount: count() })
      .from(schema.disputes)
      .where(eq(schema.disputes.sellerId, sellerId));

    const disputeCount = Number(disputeRow?.dispCount ?? 0);
    const disputePenalty = Math.min(disputeCount * 5, 100);

    // 5. Score según fórmula prompt v7
    const score = Math.max(
      0,
      (avgRatingVal / 5) * 100 * 0.4 +
        responseRate * 100 * 0.2 +
        fulfillmentRate * 100 * 0.3 -
        disputePenalty * 0.1,
    );

    const badge = calcBadge(score, avgRatingVal);

    // 6. Upsert sellerReputation
    await this.db
      .insert(schema.sellerReputation)
      .values({
        sellerId,
        avgRating: String(avgRatingVal),
        responseRate: String(responseRate),
        fulfillmentRate: String(fulfillmentRate),
        disputeCount,
        score: String(score),
        badge,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.sellerReputation.sellerId,
        set: {
          avgRating: String(avgRatingVal),
          responseRate: String(responseRate),
          fulfillmentRate: String(fulfillmentRate),
          disputeCount,
          score: String(score),
          badge,
          updatedAt: new Date(),
        },
      });

    this.logger.log(
      `Seller ${sellerId} — score: ${score.toFixed(1)}, badge: ${badge}`,
    );
  }
}
