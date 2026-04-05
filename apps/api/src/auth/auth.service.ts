import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DrizzleService } from '../database/database.module';
import * as schema from '../database/schema';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly authInstance: any;

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly configService: ConfigService,
  ) {
    this.authInstance = betterAuth({
      secret: this.configService.getOrThrow<string>('BETTER_AUTH_SECRET'),
      baseURL: this.configService.getOrThrow<string>('BETTER_AUTH_URL'),
      database: drizzleAdapter(this.drizzleService.db, {
        provider: 'pg',
        schema: {
          user: schema.users,
          session: schema.sessions,
          account: schema.accounts,
          verification: schema.verifications,
        },
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      user: {
        additionalFields: {
          role: {
            type: 'string',
            defaultValue: 'buyer',
            input: false,
          },
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60,
        },
      },
      trustedOrigins: [
        this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
      ],
    });
  }

  getAuth() {
    return this.authInstance;
  }
}
