import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @IsUUID()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @IsString()
  @IsNotEmpty()
  carrier: string;

  @IsString()
  @IsOptional()
  estimatedDelivery?: string;
}
