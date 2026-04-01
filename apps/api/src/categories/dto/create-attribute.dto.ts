import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  name!: string;

  @IsIn(['text', 'number', 'boolean', 'select'])
  type!: 'text' | 'number' | 'boolean' | 'select';

  @IsOptional()
  options?: string[];

  @IsOptional()
  required?: boolean;
}
