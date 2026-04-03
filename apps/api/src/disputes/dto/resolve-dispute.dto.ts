import { IsString, IsNotEmpty, IsIn } from 'class-validator';

// Alineado con disputeStatusEnum en reviews.schema.ts:
// 'open' | 'under_review' | 'resolved' | 'closed'
export class ResolveDisputeDto {
  @IsIn(['under_review', 'resolved', 'closed'])
  status!: string;

  @IsString()
  @IsNotEmpty()
  resolution!: string;
}
