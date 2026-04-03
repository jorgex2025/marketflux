import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  parentId?: string;

  @IsOptional() @IsString()
  image?: string;

  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  position?: number;
}
