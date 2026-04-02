import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsOptional()
  shippingMethodId?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;
}
