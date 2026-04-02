import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsInt()
  @Min(1)
  qty!: number;
}
