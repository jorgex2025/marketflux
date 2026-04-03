import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  featured?: boolean;
  status?: 'draft' | 'active' | 'archived';
  attributes?: Record<string, unknown>;
}
