import { All, Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Health check — @Public() excluye del AuthGuard
   * GET /api/health
   */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Better Auth handler — captura todas las rutas bajo /api/auth/*
   * Ej: POST /api/auth/sign-in, POST /api/auth/sign-up, GET /api/auth/session
   */
  @Public()
  @All('auth/*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const auth = this.authService.getAuth();
    const response = await auth.handler(
      new Request(`http://localhost${req.originalUrl}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body:
          req.method !== 'GET' && req.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined,
      }),
    );

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const body = await response.text();
    res.send(body);
  }
}
