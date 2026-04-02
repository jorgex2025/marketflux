import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { ReservationCleanupProcessor, RESERVATION_CLEANUP_QUEUE } from './processors/reservation-cleanup.processor';
import { EmailProcessor, EMAIL_QUEUE } from './processors/email.processor';
import { PayoutProcessor, PAYOUT_QUEUE } from './processors/payout.processor';
import { OrderExpiryProcessor, ORDER_EXPIRY_QUEUE } from './processors/order-expiry.processor';
import { IndexingProcessor, INDEXING_QUEUE } from './processors/indexing.processor';

import { CronSchedulerService } from './cron-scheduler.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: RESERVATION_CLEANUP_QUEUE },
      { name: EMAIL_QUEUE },
      { name: PAYOUT_QUEUE },
      { name: ORDER_EXPIRY_QUEUE },
      { name: INDEXING_QUEUE },
    ),
    DatabaseModule,
    NotificationsModule,
  ],
  providers: [
    CronSchedulerService,
    ReservationCleanupProcessor,
    EmailProcessor,
    PayoutProcessor,
    OrderExpiryProcessor,
    IndexingProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
