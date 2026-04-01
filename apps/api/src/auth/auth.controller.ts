import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.service';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class AuthController {
  private readonly handler = toNodeHandler(auth);

  @Public()
  @All('/auth/*')
  async handleAuth(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handler(req, res);
  }
}
