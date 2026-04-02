import { IsEnum } from 'class-validator';

export class ModerateReviewDto {
  @IsEnum(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}
