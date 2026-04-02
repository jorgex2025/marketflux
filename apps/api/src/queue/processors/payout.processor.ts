import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

export const PAYOUT_QUEUE = 'payout';

export interface PayoutJobData {
  payoutId: string;
  vendorId: string;
  amount: number;
  stripeAccountId: string;
}

@Processor(PAYOUT_QUEUE)
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<PayoutJobData>): Promise<void> {
    const { payoutId, vendorId, amount, stripeAccountId } = job.data;
    this.logger.log(`[payout] Procesando payout ${payoutId} — vendor ${vendorId} — $${amount}`);

    try {
      // TODO: llamar a stripe.transfers.create() en Fase 12
      // const transfer = await stripe.transfers.create({ amount: amount * 100, currency: 'usd', destination: stripeAccountId });

      await this.db
        .update(schema.payouts)
        .set({ status: 'completed', processedAt: new Date() })
        .where(eq(schema.payouts.id, payoutId));

      this.logger.log(`[payout] Payout ${payoutId} marcado como completed`);
    } catch (err) {
      await this.db
        .update(schema.payouts)
        .set({ status: 'failed' })
        .where(eq(schema.payouts.id, payoutId));
      this.logger.error(`[payout] Error en payout ${payoutId}`, err);
      throw err;
    }
  }
}
