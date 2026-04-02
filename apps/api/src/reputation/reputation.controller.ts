import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { Public } from '../common/decorators/public.decorator';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('reputation')
@UseGuards(AuthGuard)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Public()
  @Get(':sellerId')
  getReputation(@Param('sellerId') sellerId: string) {
    return this.reputationService.getReputation(sellerId);
  }
}
