import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, and, lt } from 'drizzle-orm';

export const ORDER_EXPIRY_QUEUE = 'order-expiry';

@Processor(ORDER_EXPIRY_QUEUE)
export class OrderExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderExpiryProcessor.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutos

    const expired = await this.db
      .update(schema.orders)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(schema.orders.status, 'pending_payment'),
          lt(schema.orders.createdAt, threshold),
        ),
      )
      .returning({ id: schema.orders.id });

    if (expired.length > 0) {
      this.logger.log(`[order-expiry] ${expired.length} órdenes expiradas canceladas`);
    }
  }
}
