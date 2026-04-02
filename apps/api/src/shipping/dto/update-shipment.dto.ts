import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateShipmentDto {
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  carrier?: string;

  @IsIn(['pending', 'shipped', 'in_transit', 'delivered', 'failed'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  estimatedDelivery?: string;
}
