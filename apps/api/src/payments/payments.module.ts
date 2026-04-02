import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    DatabaseModule,
    OrdersModule, // necesario para inyectar OrdersService
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
