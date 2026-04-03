import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/config')
@UseGuards(AuthGuard, RolesGuard)
export class MarketplaceConfigController {
  constructor(private readonly configService: MarketplaceConfigService) {}

  @Get()
  @Roles('admin', 'superadmin')
  getAll() {
    return this.configService.getAll();
  }

  @Get(':key')
  @Roles('admin', 'superadmin')
  getOne(@Param('key') key: string) {
    return this.configService.get(key);
  }

  @Patch(':key')
  @Roles('superadmin')
  update(@Param('key') key: string, @Body() dto: UpdateConfigDto) {
    return this.configService.set(key, dto.value, dto.description);
  }

  @Patch()
  @Roles('superadmin')
  updateBulk(
    @Body() entries: Array<{ key: string; value: string; description?: string }>,
  ) {
    return this.configService.setBulk(entries);
  }
}
