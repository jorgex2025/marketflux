import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RESERVATION_CLEANUP_QUEUE } from './processors/reservation-cleanup.processor';
import { ORDER_EXPIRY_QUEUE } from './processors/order-expiry.processor';
import { PAYOUT_QUEUE } from './processors/payout.processor';

@Injectable()
export class CronSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CronSchedulerService.name);

  constructor(
    @InjectQueue(RESERVATION_CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
    @InjectQueue(ORDER_EXPIRY_QUEUE)
    private readonly orderExpiryQueue: Queue,
    @InjectQueue(PAYOUT_QUEUE)
    private readonly payoutQueue: Queue,
  ) {}

  async onModuleInit() {
    // Limpieza de reservas de inventario — cada 5 min
    await this.registerCron(
      this.cleanupQueue,
      'cleanup',
      5 * 60 * 1000,
      'Reservation cleanup cron registered (every 5 min)',
    );

    // Expiración de órdenes sin pago — cada 10 min
    await this.registerCron(
      this.orderExpiryQueue,
      'expire-orders',
      10 * 60 * 1000,
      'Order expiry cron registered (every 10 min)',
    );

    // Sweep de payouts pendientes — cada hora
    await this.registerCron(
      this.payoutQueue,
      'payout-sweep',
      60 * 60 * 1000,
      'Payout sweep cron registered (every 1 hour)',
    );
  }

  private async registerCron(queue: Queue, jobName: string, every: number, logMsg: string) {
    const repeatables = await queue.getRepeatableJobs();
    for (const job of repeatables) {
      await queue.removeRepeatableByKey(job.key);
    }
    await queue.add(jobName, {}, {
      repeat: { every },
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.log(logMsg);
  }
}
