import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReturnDto } from './dto/create-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';

@Controller('returns')
@UseGuards(AuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles('buyer')
  create(
    @Body() dto: CreateReturnDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.returnsService.create(dto, user.id);
  }

  @Get('my')
  findMy(@CurrentUser() user: { id: string }) {
    return this.returnsService.findMy(user.id);
  }

  @Get()
  @Roles('seller', 'admin')
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.returnsService.findAll(user.id, user.role);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.returnsService.findOne(id, user.id, user.role);
  }

  @Patch(':id/approve')
  @Roles('seller', 'admin')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.returnsService.approve(id, user.id, user.role);
  }

  @Patch(':id/reject')
  @Roles('seller', 'admin')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectReturnDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.returnsService.reject(id, dto.reason, user.id, user.role);
  }

  @Post(':id/refund')
  @Roles('admin')
  refund(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.returnsService.refund(id, user.id);
  }
}
