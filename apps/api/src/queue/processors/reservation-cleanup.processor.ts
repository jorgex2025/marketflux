import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, lt, sql } from 'drizzle-orm';
import * as schema from '../../database/schema/index';
import { DATABASE_TOKEN } from '../../database/database.module';

export const RESERVATION_CLEANUP_QUEUE = 'reservation-cleanup';

@Processor(RESERVATION_CLEANUP_QUEUE)
@Injectable()
export class ReservationCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationCleanupProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Running reservation cleanup job: ${job.id}`);
    const now = new Date();

    const expired = await this.db
      .select()
      .from(schema.inventoryReservations)
      .where(
        and(
          eq(schema.inventoryReservations.status, 'reserved'),
          lt(schema.inventoryReservations.expiresAt, now),
        ),
      );

    this.logger.log(`Found ${expired.length} expired reservations`);

    for (const reservation of expired) {
      await this.db
        .update(schema.inventoryReservations)
        .set({ status: 'released' })
        .where(eq(schema.inventoryReservations.id, reservation.id));

      if (reservation.variantId) {
        await this.db
          .update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} + ${reservation.qty}` })
          .where(eq(schema.productVariants.id, reservation.variantId));
      } else {
        await this.db
          .update(schema.products)
          .set({ stock: sql`${schema.products.stock} + ${reservation.qty}` })
          .where(eq(schema.products.id, reservation.productId));
      }
      this.logger.log(`Released reservation ${reservation.id}`);
    }
  }
}
