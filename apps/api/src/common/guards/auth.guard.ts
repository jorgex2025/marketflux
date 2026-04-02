import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DrizzleService } from '../../database/database.module';
import { sessions, users } from '../../database/schema';
import { eq, and, gt } from 'drizzle-orm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private drizzleService: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Better Auth usa cookie 'better-auth.session_token' o header Bearer
    const token =
      request.cookies?.['better-auth.session_token'] ??
      request.headers?.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException();

    const db = this.drizzleService.db;
    const [session] = await db
      .select({
        sessionId: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        userRole: users.role,
        userName: users.name,
        userEmail: users.email,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) throw new UnauthorizedException();

    // Inyectar user en request para @Request() en controllers
    request.user = {
      id: session.userId,
      role: session.userRole,
      name: session.userName,
      email: session.userEmail,
    };

    return true;
  }
}
