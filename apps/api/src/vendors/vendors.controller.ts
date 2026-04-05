import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('stores')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  // Público: listado de tiendas activas
  @Public()
  @Get()
  findAll(
    @Param('q') q?: string,
    @Param('page') page?: number,
    @Param('limit') limit?: number,
  ) {
    return this.vendorsService.findAll({ q, page, limit });
  }

  // Público: detalle de tienda por slug
  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.vendorsService.findBySlug(slug);
  }

  // Admin: listar todas las tiendas (incluyendo inactivas)
  @Roles('admin')
  @Get('admin/all')
  findAllAdmin() {
    return this.vendorsService.findAll();
  }

  // Admin: cambiar estado de tienda
  @Roles('admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'pending' | 'suspended' | 'banned' },
  ) {
    return this.vendorsService.updateStatus(id, body.status);
  }

  // Admin: eliminar tienda
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }

  // Vendor: actualizar su propia tienda
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    // userId y role se obtienen del request via guards
    return this.vendorsService.update(id, dto, '', 'user');
  }

  // Vendor: completar onboarding
  @Patch(':id/onboarding')
  completeOnboarding(@Param('id') id: string) {
    return this.vendorsService.completeOnboarding(id, '');
  }
}
