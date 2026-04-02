import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RESERVATION_CLEANUP_QUEUE } from './processors/reservation-cleanup.processor';

@Injectable()
export class CronSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CronSchedulerService.name);

  constructor(
    @InjectQueue(RESERVATION_CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit() {
    // Remove old repeatable jobs to avoid duplicates on restart
    const repeatables = await this.cleanupQueue.getRepeatableJobs();
    for (const job of repeatables) {
      await this.cleanupQueue.removeRepeatableByKey(job.key);
    }
    await this.cleanupQueue.add(
      'cleanup',
      {},
      {
        repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log('Reservation cleanup cron registered (every 5 min)');
  }
}
