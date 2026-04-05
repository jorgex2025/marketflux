import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  override featured?: boolean;
  override status?: 'draft' | 'active' | 'archived';
  override attributes?: Record<string, unknown>;
}
