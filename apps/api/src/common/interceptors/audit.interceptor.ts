import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { db } from '../../database/database.module';
import { auditLogs } from '../../database/schema';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method: string;
      path: string;
      ip: string;
      params?: { id?: string };
      user?: { id?: string };
      headers: Record<string, string>;
    }>();

    return next.handle().pipe(
      tap(async () => {
        if (!AUDITED_METHODS.has(req.method)) return;
        if (!req.user?.id) return;

        const method = req.method as 'POST' | 'PATCH' | 'DELETE';
        const action = method === 'POST' ? 'CREATE' : method === 'PATCH' ? 'UPDATE' : 'DELETE';

        await db.insert(auditLogs).values({
          id: randomUUID(),
          userId: req.user.id,
          action,
          entity: req.path,
          entityId: req.params?.id ?? null,
          ip: req.ip,
        });
      }),
    );
  }
}
