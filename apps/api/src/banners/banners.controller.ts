import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
  Query,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // Público: banners activos
  @Public()
  @Get()
  findAll(@Query('position') position?: string) {
    if (position) return this.bannersService.getActive(position);
    return this.bannersService.findAll();
  }

  // Admin: crear banner
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: {
    title: string;
    image: string;
    url?: string;
    position: string;
    startsAt: Date;
    endsAt: Date;
  }) {
    return this.bannersService.create(dto);
  }

  // Admin: actualizar banner
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: {
      title?: string;
      image?: string;
      url?: string;
      position?: string;
      active?: boolean;
      startsAt?: Date;
      endsAt?: Date;
    },
  ) {
    return this.bannersService.update(id, dto);
  }

  // Admin: eliminar banner
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
