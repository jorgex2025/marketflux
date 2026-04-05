import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateShippingMethodDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  zoneId?: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsNumber()
  @IsOptional()
  estimatedDays?: number;

  @IsString()
  @IsOptional()
  countries?: string;
}
