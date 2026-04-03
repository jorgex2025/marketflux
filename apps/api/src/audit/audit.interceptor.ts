import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

/**
 * Decorar cualquier controller con @UseInterceptors(AuditInterceptor)
 * para registrar automáticamente la acción en audit_logs.
 *
 * Usage:
 *   @UseInterceptors(AuditInterceptor)
 *   @Post('orders')
 *   createOrder(...) {}
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const method = req.method;
    const url: string = req.url ?? '';
    const resource = url.split('/')[2] ?? 'unknown';

    return next.handle().pipe(
      tap(() => {
        if (!user?.id) return;
        void this.auditService.log({
          userId: user.id,
          action: method,
          entity: resource,
          entityId: req.params?.id,
          metadata: { body: req.body, query: req.query },
          ipAddress: req.ip,
        });
      }),
    );
  }
}
