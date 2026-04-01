import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { CreateAttributeDto } from './dto/create-attribute.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Public()
  @Get()
  async findAll() {
    return { data: await this.svc.findTree() };
  }

  @Public()
  @Get(':id/attributes')
  async findAttributes(@Param('id') id: string) {
    return { data: await this.svc.findAttributes(id) };
  }

  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return { data: await this.svc.create(dto) };
  }

  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return { data: await this.svc.update(id, dto) };
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
    return { data: { deleted: true } };
  }

  @Roles('admin')
  @Post(':id/attributes')
  async createAttribute(
    @Param('id') categoryId: string,
    @Body() dto: CreateAttributeDto,
  ) {
    return { data: await this.svc.createAttribute(categoryId, dto) };
  }

  @Roles('admin')
  @Patch(':id/attributes/:attrId')
  async updateAttribute(
    @Param('id') categoryId: string,
    @Param('attrId') attrId: string,
    @Body() dto: Partial<CreateAttributeDto>,
  ) {
    return { data: await this.svc.updateAttribute(categoryId, attrId, dto) };
  }

  @Roles('admin')
  @Delete(':id/attributes/:attrId')
  async removeAttribute(
    @Param('id') categoryId: string,
    @Param('attrId') attrId: string,
  ) {
    await this.svc.removeAttribute(categoryId, attrId);
    return { data: { deleted: true } };
  }
}
