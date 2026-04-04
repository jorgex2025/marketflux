import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsBoolean, IsArray, IsEnum, Min, IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString() @IsNotEmpty()
  name: string = '';

  @IsOptional() @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  @Type(() => Number)
  price: number = 0;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  @Type(() => Number)
  comparePrice?: number;

  @IsNumber() @Min(0)
  @Type(() => Number)
  stock: number = 0;

  @IsOptional() @IsString()
  sku?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @IsOptional() @IsBoolean()
  featured?: boolean = false;

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: 'draft' | 'active' | 'archived';

  @IsOptional()
  attributes?: Record<string, unknown> = {};
}
