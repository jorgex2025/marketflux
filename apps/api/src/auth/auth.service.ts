import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema/index';
import type { Request } from 'express';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class AuthService {
  public readonly auth: ReturnType<typeof betterAuth>;

  constructor(@Inject(DATABASE_TOKEN) private readonly db: DB) {
    this.auth = betterAuth({
      database: drizzleAdapter(this.db, {
        provider: 'pg',
        schema: {
          user: schema.users,
          session: schema.sessions,
          account: schema.accounts,
          verification: schema.verifications,
        },
      }),
      secret: process.env['BETTER_AUTH_SECRET'] ?? 'change-this-in-production-min-32-chars',
      baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3001',
      trustedOrigins: [
        process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
      ],
      user: {
        additionalFields: {
          role: { type: 'string', defaultValue: 'buyer' },
        },
      },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
    });
  }
}
