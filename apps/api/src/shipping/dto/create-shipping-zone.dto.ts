import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateShippingZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsOptional()
  countries?: string[];
}
