import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDrizzle } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export const PAYMENT_QUEUE = 'payment';

export interface PaymentJobData {
  orderId: string;
  paymentId: string;
  event: 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
}

@Processor(PAYMENT_QUEUE)
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<PaymentJobData>): Promise<void> {
    const { orderId, paymentId, event } = job.data;
    this.logger.log(`Processing payment event "${event}" for order ${orderId}`);

    if (event === 'payment.succeeded') {
      await this.handlePaymentSucceeded(orderId, paymentId);
    } else if (event === 'payment.failed') {
      await this.handlePaymentFailed(orderId);
    } else if (event === 'payment.refunded') {
      await this.handlePaymentRefunded(orderId);
    }
  }

  private async handlePaymentSucceeded(orderId: string, paymentId: string): Promise<void> {
    // 1. Update order status to paid
    await this.db
      .update(schema.orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    // 2. Update payment status
    await this.db
      .update(schema.payments)
      .set({ status: 'succeeded', updatedAt: new Date() })
      .where(eq(schema.payments.id, paymentId));

    // 3. Confirm inventory reservations (reserved -> confirmed) and deduct stock
    const reservations = await this.db
      .select()
      .from(schema.inventoryReservations)
      .where(
        and(
          eq(schema.inventoryReservations.orderId, orderId),
          eq(schema.inventoryReservations.status, 'reserved'),
        ),
      );

    for (const reservation of reservations) {
      await this.db
        .update(schema.inventoryReservations)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(schema.inventoryReservations.id, reservation.id));

      if (reservation.variantId) {
        const [variant] = await this.db
          .select()
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, reservation.variantId));
        if (variant) {
          await this.db
            .update(schema.productVariants)
            .set({ stock: Math.max(0, (variant.stock ?? 0) - reservation.quantity) })
            .where(eq(schema.productVariants.id, reservation.variantId));
        }
      }
    }

    this.logger.log(`Order ${orderId} confirmed, ${reservations.length} reservations committed`);
  }

  private async handlePaymentFailed(orderId: string): Promise<void> {
    await this.db
      .update(schema.orders)
      .set({ status: 'payment_failed', updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    // Release reservations
    await this.db
      .update(schema.inventoryReservations)
      .set({ status: 'released', updatedAt: new Date() })
      .where(
        and(
          eq(schema.inventoryReservations.orderId, orderId),
          eq(schema.inventoryReservations.status, 'reserved'),
        ),
      );

    this.logger.warn(`Payment failed for order ${orderId}, reservations released`);
  }

  private async handlePaymentRefunded(orderId: string): Promise<void> {
    await this.db
      .update(schema.orders)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    this.logger.log(`Order ${orderId} marked as refunded`);
  }
}
