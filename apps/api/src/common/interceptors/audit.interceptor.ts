import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { DB } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.module';
import { auditLogs } from '../../database/schema';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'DELETE']);
const METHOD_TO_ACTION = { POST: 'CREATE', PATCH: 'UPDATE', DELETE: 'DELETE' } as const;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method: string;
      path: string;
      ip: string;
      params?: { id?: string };
      user?: { id?: string };
    }>();

    return next.handle().pipe(
      tap({
        next: () => {
          if (!AUDITED_METHODS.has(req.method)) return;
          if (!req.user?.id) return;

          const action = METHOD_TO_ACTION[req.method as keyof typeof METHOD_TO_ACTION];

          // Fire-and-forget: no bloquea la respuesta, errores son logueados
          this.db
            .insert(auditLogs)
            .values({
              id: randomUUID(),
              userId: req.user.id,
              action,
              entity: req.path,
              entityId: req.params?.id ?? null,
              ip: req.ip,
            })
            .catch((err: unknown) =>
              this.logger.error('Audit log insert failed', err),
            );
        },
      }),
    );
  }
}
