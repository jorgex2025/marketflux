import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DB = Symbol('DB');

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => {
        if (!process.env.DATABASE_URL) {
          throw new Error(
            '[DatabaseModule] DATABASE_URL env variable is required but not defined.',
          );
        }
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
