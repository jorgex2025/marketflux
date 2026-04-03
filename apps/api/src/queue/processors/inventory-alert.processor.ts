import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectDrizzle } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq, lte, and } from 'drizzle-orm';
import { NOTIFICATION_QUEUE, NotificationJobData } from './notification.processor';

export const INVENTORY_ALERT_QUEUE = 'inventory-alert';

export interface InventoryAlertJobData {
  productId: string;
  variantId?: string;
  currentStock: number;
  sellerId: string;
}

@Processor(INVENTORY_ALERT_QUEUE)
export class InventoryAlertProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryAlertProcessor.name);

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase<typeof schema>,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue<NotificationJobData>,
  ) {
    super();
  }

  async process(job: Job<InventoryAlertJobData>): Promise<void> {
    const { productId, variantId, currentStock, sellerId } = job.data;

    // Find matching alerts for this product/variant where threshold >= currentStock
    const alerts = await this.db
      .select()
      .from(schema.inventoryAlerts)
      .where(
        and(
          eq(schema.inventoryAlerts.productId, productId),
          lte(schema.inventoryAlerts.threshold, currentStock + 1),
        ),
      );

    for (const alert of alerts) {
      if (currentStock <= alert.threshold) {
        this.logger.warn(
          `Low stock alert: product ${productId}${
            variantId ? ` variant ${variantId}` : ''
          } has ${currentStock} units (threshold: ${alert.threshold})`,
        );

        await this.notificationQueue.add('low-stock', {
          type: 'lowstock',
          userId: sellerId,
          payload: {
            productId,
            variantId,
            currentStock,
            threshold: alert.threshold,
          },
        });
      }
    }
  }
}
