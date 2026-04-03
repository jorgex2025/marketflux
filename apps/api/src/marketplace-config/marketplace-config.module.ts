import { Module } from '@nestjs/common';
import { MarketplaceConfigService } from './marketplace-config.service';
import { MarketplaceConfigController } from './marketplace-config.controller';
import { DatabaseModule } from '../database/database.module';
// import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [DatabaseModule],
  providers: [MarketplaceConfigService],
  controllers: [MarketplaceConfigController],
  exports: [MarketplaceConfigService],
})
export class MarketplaceConfigModule {}
