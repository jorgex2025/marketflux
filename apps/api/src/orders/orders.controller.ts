import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.service';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  getOrders(
    @Req() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.ordersService.getOrders(req.user.id, Number(page), Number(limit));
  }

  @Get(':id')
  getOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.getOrder(id, req.user.id);
  }

  @Patch(':id/cancel')
  cancelOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  @Get(':id/items/:itemId/review-eligible')
  isReviewEligible(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.isReviewEligible(id, itemId, req.user.id);
  }
}
