import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @Override
  featured?: boolean;

  @Override
  status?: 'draft' | 'active' | 'archived';

  @Override
  attributes?: Record<string, unknown>;
}
