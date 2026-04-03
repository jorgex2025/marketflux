import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DrizzleService } from '../../database/database.module';
import { auditLogs } from '../../database/schema';
import { createId } from '@paralleldrive/cuid2';
import { Request } from 'express';

const AUDIT_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly drizzleService: DrizzleService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = ctx.switchToHttp().getRequest<Request & { user?: { id: string } }>();

    if (!AUDIT_METHODS.has(request.method)) {
      return next.handle();
    }

    const userId  = request.user?.id ?? null;
    const action  = request.method;
    const entity  = this.resolveEntity(request.path);
    const entityId = this.resolveEntityId(request.path, request.params);
    const ipAddress = (request.headers['x-forwarded-for'] as string | undefined)
      ?? request.socket?.remoteAddress
      ?? null;

    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await this.drizzleService.db.insert(auditLogs).values({
              id: createId(),
              userId,
              action,
              entity,
              entityId,
              ipAddress,
              after: null,
              before: null,
            });
          } catch {
            // No bloquear la respuesta si falla el audit
          }
        },
      }),
    );
  }

  private resolveEntity(path: string): string {
    const parts = path.replace('/api/', '').split('/');
    return parts[0] ?? 'unknown';
  }

  private resolveEntityId(
    path: string,
    params: Record<string, string>,
  ): string | null {
    return params?.['id'] ?? params?.['slug'] ?? null;
  }
}
