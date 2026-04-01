import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DB } from '../database/database.module';
import type { DrizzleDB } from '../database/database.module';
import {
  users,
  sessions,
  accounts,
  verifications,
} from '../database/schema';

export type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthService implements OnModuleInit {
  private _auth!: BetterAuthInstance;

  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  onModuleInit(): void {
    this._auth = betterAuth({
      database: drizzleAdapter(this.db, {
        provider: 'pg',
        schema: {
          user: users,
          session: sessions,
          account: accounts,
          verification: verifications,
        },
      }),
      emailAndPassword: { enabled: true },
      trustedOrigins: [process.env['FRONTEND_URL'] ?? 'http://localhost:3000'],
      user: {
        additionalFields: {
          role: { type: 'string', defaultValue: 'buyer', input: false },
        },
      },
    });
  }

  get instance(): BetterAuthInstance {
    return this._auth;
  }
}
