import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateReturnDto {
  @IsUUID()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  evidence?: string;
}
