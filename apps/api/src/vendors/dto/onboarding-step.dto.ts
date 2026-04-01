import { IsIn, IsInt, IsObject, Max, Min } from 'class-validator';

export class OnboardingStepDto {
  @IsInt()
  @Min(1)
  @Max(4)
  step!: number;

  @IsObject()
  data!: Record<string, unknown>;
}
