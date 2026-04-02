import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class CreateAlertDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsInt()
  @Min(1)
  threshold!: number;
}
