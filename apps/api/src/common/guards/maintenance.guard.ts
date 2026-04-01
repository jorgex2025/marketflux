import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { db } from '../../database/database.module';
import { marketplaceConfig } from '../../database/schema';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const [config] = await db.select().from(marketplaceConfig).limit(1);
    if (!config?.maintenanceMode) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: { role?: string } }>();
    if (req.user?.role === 'admin') return true;

    throw new HttpException(
      { error: 'SERVICE_UNAVAILABLE', message: 'Marketplace is under maintenance' },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
