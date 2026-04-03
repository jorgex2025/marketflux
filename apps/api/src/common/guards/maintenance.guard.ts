import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DrizzleService } from '../../database/database.module';
import { marketplaceConfig } from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly drizzleService: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Siempre permitir rutas públicas
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const db = this.drizzleService.db;
    const [row] = await db
      .select({ value: marketplaceConfig.value })
      .from(marketplaceConfig)
      .where(eq(marketplaceConfig.key, 'maintenance_mode'))
      .limit(1);

    const inMaintenance = row?.value === 'true';
    if (!inMaintenance) return true;

    // Si está en mantenimiento, verificar si el usuario es admin
    const request = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    const role = request.user?.role;
    if (role === 'admin') return true;

    throw new ServiceUnavailableException({
      error: {
        code: 'MAINTENANCE_MODE',
        message: 'El marketplace está en mantenimiento. Vuelve pronto.',
      },
    });
  }
}
