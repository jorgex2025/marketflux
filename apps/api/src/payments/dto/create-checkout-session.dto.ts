import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
