import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const excResponse = exception.getResponse();

    // Si el handler ya retornó el formato estándar { error: { code, message } }, pasarlo tal cual
    if (
      typeof excResponse === 'object' &&
      excResponse !== null &&
      'error' in excResponse
    ) {
      response.status(status).json(excResponse);
      return;
    }

    const message =
      typeof excResponse === 'string'
        ? excResponse
        : (excResponse as { message?: string }).message ?? exception.message;

    response.status(status).json({
      error: {
        code: `HTTP_${status}`,
        message,
        details: process.env['NODE_ENV'] !== 'production'
          ? { path: request.url, method: request.method }
          : undefined,
      },
    });
  }
}
