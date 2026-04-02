import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.service';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addItem(@Body() dto: AddCartItemDto, @Req() req: AuthenticatedRequest) {
    return this.cartService.addItem(dto, req.user.id);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartService.updateItem(id, dto, req.user.id);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.cartService.removeItem(id, req.user.id);
  }

  @Post('coupon')
  applyCoupon(@Body() dto: ApplyCouponDto, @Req() req: AuthenticatedRequest) {
    return this.cartService.applyCoupon(dto, req.user.id);
  }

  @Delete('coupon')
  removeCoupon(@Req() req: AuthenticatedRequest) {
    return this.cartService.removeCoupon(req.user.id);
  }
}
