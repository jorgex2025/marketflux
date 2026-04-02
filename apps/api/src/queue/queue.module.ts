import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReservationCleanupProcessor, RESERVATION_CLEANUP_QUEUE } from './processors/reservation-cleanup.processor';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: RESERVATION_CLEANUP_QUEUE },
    ),
    DatabaseModule,
  ],
  providers: [ReservationCleanupProcessor],
  exports: [BullModule],
})
export class QueueModule {}
