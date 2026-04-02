import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Controller('shipping')
@UseGuards(AuthGuard, RolesGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ── Shipping Zones (admin) ──────────────────────────────────────────
  @Get('zones')
  @Roles('admin')
  findAllZones() {
    return this.shippingService.findAllZones();
  }

  @Post('zones')
  @Roles('admin')
  createZone(@Body() dto: CreateShippingZoneDto) {
    return this.shippingService.createZone(dto);
  }

  @Patch('zones/:id')
  @Roles('admin')
  updateZone(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.shippingService.updateZone(id, dto);
  }

  // ── Shipping Methods (public GET, admin mutate) ─────────────────────
  @Get('methods')
  @Public()
  findMethods(@Query('country') country?: string) {
    return this.shippingService.findMethods(country);
  }

  @Post('methods')
  @Roles('admin')
  createMethod(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.createMethod(dto);
  }

  @Patch('methods/:id')
  @Roles('admin')
  updateMethod(@Param('id') id: string, @Body() dto: UpdateShippingMethodDto) {
    return this.shippingService.updateMethod(id, dto);
  }

  // ── Shipments ───────────────────────────────────────────────────────
  @Get('shipments')
  @Roles('seller', 'admin')
  findShipments(@CurrentUser() user: { id: string; role: string }) {
    return this.shippingService.findShipments(user.id, user.role);
  }

  @Post('shipments')
  @Roles('seller', 'admin')
  createShipment(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.shippingService.createShipment(dto, user.id);
  }

  @Patch('shipments/:id')
  @Roles('seller', 'admin')
  updateShipment(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.shippingService.updateShipment(id, dto, user.id, user.role);
  }

  // ── Public tracking ─────────────────────────────────────────────────
  @Get('track/:trackingNumber')
  @Public()
  trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.trackShipment(trackingNumber);
  }
}
