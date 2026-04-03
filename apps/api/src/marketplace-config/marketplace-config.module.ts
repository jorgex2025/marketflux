import { Module } from '@nestjs/common';
import { MarketplaceConfigService } from './marketplace-config.service';
import { MarketplaceConfigController } from './marketplace-config.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [DrizzleModule, RedisModule],
  providers: [MarketplaceConfigService],
  controllers: [MarketplaceConfigController],
  exports: [MarketplaceConfigService],
})
export class MarketplaceConfigModule {}
