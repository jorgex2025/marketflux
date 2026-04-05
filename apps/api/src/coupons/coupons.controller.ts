import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
  Query,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Admin/Seller: listar cupones
  @Roles('admin', 'seller')
  @Get()
  findAll(@Query('storeId') storeId?: string) {
    return this.couponsService.findAll(storeId);
  }

  // Admin/Seller: obtener cupón por ID
  @Roles('admin', 'seller')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findById(id);
  }

  // Admin/Seller: crear cupón
  @Roles('admin', 'seller')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: {
    code: string;
    type: 'percentage' | 'fixed';
    value: string;
    minOrderAmount?: string;
    usageLimit?: string;
    storeId?: string;
    startsAt?: Date;
    endsAt?: Date;
  }) {
    return this.couponsService.create(dto);
  }

  // Admin/Seller: actualizar cupón
  @Roles('admin', 'seller')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: {
      value?: string;
      active?: boolean;
      usageLimit?: string;
      startsAt?: Date;
      endsAt?: Date;
    },
    @Query('storeId') storeId?: string,
  ) {
    return this.couponsService.update(id, dto, storeId);
  }

  // Admin/Seller: eliminar cupón
  @Roles('admin', 'seller')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Query('storeId') storeId?: string) {
    return this.couponsService.remove(id, storeId);
  }

  // Público: validar cupón
  @Public()
  @Post('validate')
  validate(@Body() dto: { code: string; cartTotal: string }) {
    return this.couponsService.validate(dto.code, dto.cartTotal);
  }

  // Público: flash sales activos
  @Public()
  @Get('flash-sales/active')
  getFlashSales() {
    return this.couponsService.getFlashSales();
  }
}
