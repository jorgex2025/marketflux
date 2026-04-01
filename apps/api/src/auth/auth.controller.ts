import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Wildcard — NestJS necesita el path exacto con {*} en v11
  // El prefijo /api está seteado en main.ts, así que NestJS ve "/auth/{*path}"
  @Public()
  @All('auth/{*path}')
  async handleAuth(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const handler = toNodeHandler(this.authService.instance);
    await handler(req, res);
  }
}
