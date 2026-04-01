import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/** Token principal (usado por guards/interceptors de Fase 2) */
export const DB = Symbol('DB');

/**
 * Alias de DB — usado por servicios de Fase 3+.
 * Apuntan al mismo provider para no duplicar la conexión.
 */
export const DATABASE_TOKEN = DB;

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

function createPool(): Pool {
  if (!process.env['DATABASE_URL']) {
    throw new Error(
      '[DatabaseModule] DATABASE_URL env variable is required but not defined.',
    );
  }
  return new Pool({ connectionString: process.env['DATABASE_URL'] });
}

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => drizzle(createPool(), { schema }),
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
