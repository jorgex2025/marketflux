import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

function parseRange(from?: string, to?: string) {
  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
}

@Controller('api/analytics')
@UseGuards(AuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─── SELLER ───────────────────────────────────────────────────────────────

  /** GET /api/analytics/seller/:storeId/summary */
  @Get('seller/:storeId/summary')
  @Roles('seller', 'admin', 'superadmin')
  sellerSummary(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSellerSummary(storeId, parseRange(from, to));
  }

  /** GET /api/analytics/seller/:storeId/top-products */
  @Get('seller/:storeId/top-products')
  @Roles('seller', 'admin', 'superadmin')
  sellerTopProducts(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.analyticsService.getSellerTopProducts(
      storeId,
      parseRange(from, to),
      Math.min(limit, 50),
    );
  }

  /** GET /api/analytics/seller/:storeId/revenue-by-day */
  @Get('seller/:storeId/revenue-by-day')
  @Roles('seller', 'admin', 'superadmin')
  sellerRevenueByDay(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSellerRevenueByDay(
      storeId,
      parseRange(from, to),
    );
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  /** GET /api/analytics/admin/summary */
  @Get('admin/summary')
  @Roles('admin', 'superadmin')
  adminSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getAdminSummary(parseRange(from, to));
  }

  /** GET /api/analytics/admin/top-stores */
  @Get('admin/top-stores')
  @Roles('admin', 'superadmin')
  adminTopStores(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.analyticsService.getAdminTopStores(
      parseRange(from, to),
      Math.min(limit, 50),
    );
  }

  /** GET /api/analytics/admin/gmv-by-day */
  @Get('admin/gmv-by-day')
  @Roles('admin', 'superadmin')
  adminGmvByDay(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getAdminGmvByDay(parseRange(from, to));
  }

  /** GET /api/analytics/admin/order-status */
  @Get('admin/order-status')
  @Roles('admin', 'superadmin')
  adminOrderStatus(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getAdminOrderStatusBreakdown(
      parseRange(from, to),
    );
  }
}
