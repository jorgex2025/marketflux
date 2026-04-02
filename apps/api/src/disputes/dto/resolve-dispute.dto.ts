import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['resolved_buyer', 'resolved_seller', 'closed'])
  status: string;

  @IsString()
  @IsNotEmpty()
  resolution: string;
}
