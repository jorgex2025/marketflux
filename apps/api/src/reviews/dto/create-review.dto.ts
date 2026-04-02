import { IsString, IsInt, IsOptional, IsArray, Min, Max, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
