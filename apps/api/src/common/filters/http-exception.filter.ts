import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(exception);
    }

    const exRes =
      exception instanceof HttpException ? exception.getResponse() : null;

    const body: Record<string, unknown> =
      typeof exRes === 'object' && exRes !== null
        ? (exRes as Record<string, unknown>)
        : { error: 'INTERNAL_ERROR', message: 'Unexpected server error' };

    if (!body['error']) body['error'] = 'ERROR';

    res.status(status).json(body);
  }
}
