import {
  Controller, Get, Post, Delete, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';

@Controller('wishlist')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  list(@Param('userId') userId: string) {
    return this.wishlistsService.list(userId);
  }

  @Post('items/:productId')
  addItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.addItem(userId, productId);
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.removeItem(userId, productId);
  }
}
