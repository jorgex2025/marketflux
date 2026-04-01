import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../auth/auth.service';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<
      Request & { user?: unknown; session?: unknown }
    >();

    // better-auth espera Headers (Web API), Express usa object plano — castear es seguro
    const session = await this.authService.instance.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'No valid session',
      });
    }

    req.user = session.user;
    req.session = session.session;
    return true;
  }
}
