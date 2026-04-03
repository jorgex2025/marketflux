import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { httpRequestsTotal, httpRequestDuration } from '@marketflux/monitoring';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const end = httpRequestDuration.startTimer();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const labels = {
            method: req.method,
            route: req.route?.path ?? req.url,
            status_code: String(res.statusCode),
          };
          httpRequestsTotal.inc(labels);
          end(labels);
        },
        error: (err) => {
          const labels = {
            method: req.method,
            route: req.route?.path ?? req.url,
            status_code: String(err.status ?? 500),
          };
          httpRequestsTotal.inc(labels);
          end(labels);
        },
      }),
    );
  }
}
