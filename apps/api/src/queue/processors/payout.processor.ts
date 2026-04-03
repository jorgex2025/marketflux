import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '../../database/database.module';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export const PAYOUT_QUEUE = 'payout';

export interface PayoutJobData {
  payoutId: string;
  vendorId: string;
  stripeAccountId: string;
  amountCents: number;
  currency: string;
}

@Processor(PAYOUT_QUEUE)
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    @InjectDrizzle() private readonly db: NeonHttpDatabase<typeof schema>,
  ) {
    super();
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async process(job: Job<PayoutJobData>): Promise<void> {
    const { payoutId, vendorId, stripeAccountId, amountCents, currency } = job.data;
    this.logger.log(`[${job.id}] Processing payout ${payoutId} for vendor ${vendorId} — ${amountCents} ${currency}`);

    try {
      // Crear transfer en Stripe hacia cuenta conectada del vendor
      const transfer = await this.stripe.transfers.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        destination: stripeAccountId,
        metadata: { payoutId, vendorId },
      });

      this.logger.log(`[${job.id}] Stripe transfer created: ${transfer.id}`);

      // Actualizar estado en DB
      await this.db
        .update(schema.payouts)
        .set({
          status: 'paid',
          stripeTransferId: transfer.id,
        })
        .where(eq(schema.payouts.id, payoutId));

      this.logger.log(`[${job.id}] Payout ${payoutId} marked as paid`);
    } catch (err) {
      this.logger.error(`[${job.id}] Payout ${payoutId} failed`, err);

      await this.db
        .update(schema.payouts)
        .set({ status: 'failed' })
        .where(eq(schema.payouts.id, payoutId));

      throw err;
    }
  }
}
