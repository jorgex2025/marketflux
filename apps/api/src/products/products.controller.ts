import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import type { AuthenticatedRequest } from '../auth/auth.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  // ---- Listing & Detail (público) ----

  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.svc.findAll(query);
  }

  @Roles('seller', 'admin')
  @Get('export')
  async exportCsv(
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const csv = await this.svc.exportCsv(req.user.id, req.user.role);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  }

  @Roles('seller', 'admin')
  @Get('bulk/:jobId/status')
  getBulkStatus(@Param('jobId') jobId: string) {
    return { data: this.svc.getBulkStatus(jobId) };
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return { data: await this.svc.findBySlug(slug) };
  }

  // ---- Mutations ----

  @Roles('seller', 'admin')
  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return { data: await this.svc.create(dto, req.user.id, req.user.role) };
  }

  @Roles('seller', 'admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return { data: await this.svc.update(id, dto, req.user.id, req.user.role) };
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
    return { data: { deleted: true } };
  }

  // ---- Bulk ----

  @Roles('seller', 'admin')
  @Post('bulk')
  startBulk(@Body() body: { items: unknown[] }) {
    const jobId = this.svc.startBulkJob(body.items ?? []);
    return { data: { jobId } };
  }

  // ---- CSV Import ----

  @Roles('seller', 'admin')
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) throw new Error('No file provided');
    const csv = file.buffer.toString('utf-8');
    return { data: await this.svc.importCsv(csv, req.user.id) };
  }

  // ---- Variants ----

  @Public()
  @Get(':id/variants')
  async getVariants(@Param('id') id: string) {
    return { data: await this.svc.findVariants(id) };
  }

  @Roles('seller', 'admin')
  @Post(':id/variants')
  async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return { data: await this.svc.createVariant(productId, dto) };
  }

  @Roles('seller', 'admin')
  @Patch(':id/variants/:vid')
  async updateVariant(
    @Param('id') productId: string,
    @Param('vid') variantId: string,
    @Body() dto: Partial<CreateVariantDto>,
  ) {
    return { data: await this.svc.updateVariant(productId, variantId, dto) };
  }

  @Roles('seller', 'admin')
  @Delete(':id/variants/:vid')
  async removeVariant(
    @Param('id') productId: string,
    @Param('vid') variantId: string,
  ) {
    await this.svc.removeVariant(productId, variantId);
    return { data: { deleted: true } };
  }
}
