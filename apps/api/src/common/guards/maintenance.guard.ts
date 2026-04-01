import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DB } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.module';
import { marketplaceConfig } from '../../database/schema';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const [config] = await this.db
      .select({ maintenanceMode: marketplaceConfig.maintenanceMode })
      .from(marketplaceConfig)
      .limit(1);

    if (!config?.maintenanceMode) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: { role?: string } }>();
    if (req.user?.role === 'admin') return true;

    throw new HttpException(
      { error: 'SERVICE_UNAVAILABLE', message: 'Marketplace is under maintenance' },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
