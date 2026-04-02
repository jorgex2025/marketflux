import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('disputes')
@UseGuards(AuthGuard, RolesGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @Roles('buyer')
  create(
    @Body() dto: CreateDisputeDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.disputesService.create(dto, user.id);
  }

  @Get('my')
  findMy(@CurrentUser() user: { id: string }) {
    return this.disputesService.findMy(user.id);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.disputesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.disputesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles('admin')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, dto);
  }
}
