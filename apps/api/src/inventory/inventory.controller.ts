import { Controller, Get, Patch, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.service';

@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId')
  @Roles('seller', 'admin')
  getStock(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.inventoryService.getStock(productId, req.user.id);
  }

  @Patch(':productId')
  @Roles('seller', 'admin')
  updateProductStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.updateProductStock(productId, dto, req.user.id);
  }

  @Patch(':productId/variants/:vid')
  @Roles('seller', 'admin')
  updateVariantStock(
    @Param('productId') productId: string,
    @Param('vid') vid: string,
    @Body() dto: UpdateStockDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.updateVariantStock(productId, vid, dto, req.user.id);
  }

  @Get('alerts')
  @Roles('seller', 'admin')
  getAlerts(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getAlerts(req.user.id);
  }

  @Post('alerts')
  @Roles('seller', 'admin')
  createAlert(@Body() dto: CreateAlertDto, @Req() req: AuthenticatedRequest) {
    return this.inventoryService.createAlert(dto, req.user.id);
  }

  @Delete('alerts/:id')
  @Roles('seller', 'admin')
  deleteAlert(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.inventoryService.deleteAlert(id, req.user.id);
  }
}
