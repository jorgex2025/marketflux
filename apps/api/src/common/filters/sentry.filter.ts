import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Sentry } from '@marketflux/monitoring';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Solo reportar a Sentry errores 5xx (no 4xx del cliente)
    if (status >= 500) {
      Sentry.withScope((scope: any) => {
        scope.setExtra('url', request.url);
        scope.setExtra('method', request.method);
        scope.setExtra('body', request.body);
        scope.setUser({ id: request.user?.id });
        Sentry.captureException(exception);
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
    });
  }
}
