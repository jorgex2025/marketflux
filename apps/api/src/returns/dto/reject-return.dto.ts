import { IsString, IsNotEmpty } from 'class-validator';

export class RejectReturnDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
