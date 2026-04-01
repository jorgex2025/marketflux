import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { UpdateStoreDto } from './dto/update-store.dto';
import type { OnboardingStepDto } from './dto/onboarding-step.dto';
import type { AuthenticatedRequest } from '../auth/auth.service';

@Controller('stores')
export class VendorsController {
  constructor(private readonly svc: VendorsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.svc.findAll(Number(page), Number(limit), status);
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return { data: await this.svc.findBySlug(slug) };
  }

  @Public()
  @Get(':slug/products')
  async storeProducts(
    @Param('slug') slug: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.svc.findProductsBySlug(slug, Number(page), Number(limit));
  }

  @Roles('seller', 'admin')
  @Patch('me')
  async updateMyStore(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateStoreDto,
  ) {
    return { data: await this.svc.updateMyStore(req.user.id, dto) };
  }

  @Roles('seller', 'admin')
  @Get('me/stats')
  async getMyStats(@Request() req: AuthenticatedRequest) {
    return { data: await this.svc.getMyStats(req.user.id) };
  }

  @Roles('seller', 'admin')
  @Post('onboarding')
  async onboarding(
    @Request() req: AuthenticatedRequest,
    @Body() dto: OnboardingStepDto,
  ) {
    return { data: await this.svc.handleOnboarding(req.user.id, dto) };
  }
}
