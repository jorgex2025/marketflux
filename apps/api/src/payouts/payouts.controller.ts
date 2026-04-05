import {
  Controller, Get, Post, Query, Param,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Roles('seller', 'admin')
  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.payoutsService.findAll(storeId);
  }

  @Roles('seller', 'admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payoutsService.findById(id);
  }

  @Roles('seller')
  @Get('pending-balance')
  pendingBalance(
    @Query('storeId') storeId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.payoutsService.calculatePendingBalance(
      storeId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Roles('admin')
  @Post('process')
  processPayout(
    @Query('storeId') storeId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.payoutsService.processPayout(
      storeId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Roles('admin')
  @Get('admin/summary')
  adminSummary() {
    return this.payoutsService.getAdminSummary();
  }
}
