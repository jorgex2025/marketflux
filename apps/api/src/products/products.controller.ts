import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';

type AuthRequest = Request & { user: { id: string; role: string } };

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── GET /api/products  (público, paginado, filtrable) ──
  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  // ── GET /api/products/:slug (público) ──
  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ── POST /api/products (seller | admin) ──
  @Roles('seller', 'admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto, @Req() req: AuthRequest) {
    return this.productsService.create(dto, req.user.id);
  }

  // ── PATCH /api/products/:id (seller dueño | admin) ──
  @Roles('seller', 'admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: AuthRequest,
  ) {
    return this.productsService.update(id, dto, req.user.id, req.user.role);
  }

  // ── DELETE /api/products/:id (seller dueño | admin) ──
  @Roles('seller', 'admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ── POST /api/products/bulk-import (seller | admin) ──
  @Roles('seller', 'admin')
  @Post('bulk-import')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  bulkImport(@Body() body: { rows: Record<string, unknown>[] }) {
    const jobId = this.productsService.startBulkJob(body.rows);
    return { jobId, message: 'Import iniciado en background' };
  }

  // ── GET /api/products/bulk-import/:jobId ──
  @Roles('seller', 'admin')
  @Get('bulk-import/:jobId')
  bulkStatus(@Param('jobId') jobId: string) {
    return this.productsService.getBulkStatus(jobId);
  }
}
