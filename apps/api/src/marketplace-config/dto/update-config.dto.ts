import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UpdateConfigDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  value: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
