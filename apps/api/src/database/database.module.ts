import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

export const DRIZZLE_TOKEN = 'DRIZZLE_DB';

// DrizzleService expone db como propiedad pública
import { Injectable } from '@nestjs/common';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

@Injectable()
export class DrizzleService {
  public readonly db: NeonHttpDatabase<typeof schema>;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }
    const sql = neon(databaseUrl);
    this.db = drizzle(sql, { schema });
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DatabaseModule {}
