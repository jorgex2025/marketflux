import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDrizzle } from '../../database/database.module';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../../database/schema';
import { eq, and, lt, inArray } from 'drizzle-orm';

export const ORDER_EXPIRY_QUEUE = 'order-expiry';

@Processor(ORDER_EXPIRY_QUEUE)
export class OrderExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderExpiryProcessor.name);

  constructor(
    @InjectDrizzle() private readonly db: NeonHttpDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`[${job.id}] Scanning for expired pending orders...`);

    const expiryThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 min sin pago

    const expiredOrders = await this.db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.status, 'pending'),
          lt(schema.orders.createdAt, expiryThreshold),
        ),
      );

    if (!expiredOrders.length) {
      this.logger.log(`[${job.id}] No expired orders found.`);
      return;
    }

    const ids = expiredOrders.map((o) => o.id);
    this.logger.log(`[${job.id}] Cancelling ${ids.length} expired order(s): ${ids.join(', ')}`);

    await this.db
      .update(schema.orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(inArray(schema.orders.id, ids));

    this.logger.log(`[${job.id}] Order expiry sweep complete.`);
  }
}
