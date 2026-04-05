import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
  Query,
} from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // Admin: listar comisiones
  @Roles('admin')
  @Get()
  findAll(@Query('type') type?: string) {
    return this.commissionsService.findAll(type);
  }

  // Admin: obtener comisión por ID
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commissionsService.findById(id);
  }

  // Admin: crear comisión
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: {
    type: 'global' | 'category' | 'vendor';
    referenceId?: string;
    rate: string;
    startsAt?: Date;
    endsAt?: Date;
  }) {
    return this.commissionsService.create(dto);
  }

  // Admin: actualizar comisión
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: {
      rate?: string;
      isActive?: boolean;
      startsAt?: Date;
      endsAt?: Date;
    },
  ) {
    return this.commissionsService.update(id, dto);
  }

  // Admin: eliminar comisión
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.commissionsService.remove(id);
  }

  // Público/Seller/Admin: obtener rate efectivo para una tienda
  @Public()
  @Get('effective/:storeId')
  getEffectiveRate(
    @Param('storeId') storeId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.commissionsService.getEffectiveRate(storeId, categoryId);
  }
}
