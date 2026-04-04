import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DrizzleService } from '../../database/drizzle.service';
import * as schema from '../../database/schema';
import { eq, and, lt } from 'drizzle-orm';

export const RESERVATION_CLEANUP_QUEUE = 'reservation-cleanup';

@Processor(RESERVATION_CLEANUP_QUEUE)
export class ReservationCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationCleanupProcessor.name);

  constructor(private readonly db: DrizzleService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const threshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos

    const released = await this.db
      .update(schema.inventoryReservations)
      .set({ status: 'released' })
      .where(
        and(
          eq(schema.inventoryReservations.status, 'reserved'), // ✅ valor correcto del enum
          lt(schema.inventoryReservations.createdAt, threshold),
        ),
      )
      .returning({ id: schema.inventoryReservations.id });

    if (released.length > 0) {
      this.logger.log(`[reservation-cleanup] ${released.length} reservas liberadas`);
    }
  }
}
