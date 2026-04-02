import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { ReputationProcessor } from './reputation.processor';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({ name: 'reputation' }),
  ],
  controllers: [ReputationController],
  providers: [ReputationService, ReputationProcessor],
  exports: [ReputationService],
})
export class ReputationModule {}
