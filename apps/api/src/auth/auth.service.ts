import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../database/database.module';
import {
  users,
  sessions,
  accounts,
  verifications,
} from '../database/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env['FRONTEND_URL'] ?? 'http://localhost:3000'],
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'buyer', input: false },
    },
  },
});

export type Auth = typeof auth;

@Injectable()
export class AuthService {
  getAuth(): Auth {
    return auth;
  }
}
