import { Injectable } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DrizzleService } from '../database/database.module';
import * as schema from '../database/schema';
import { desc, eq, and, gte, lte, SQL } from 'drizzle-orm';

export interface AuditQueryOptions {
  userId?: string;
  action?: string;
  resource?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly drizzleService: DrizzleService) {}

  private get db(): NeonHttpDatabase<typeof schema> {
    return this.drizzleService.db;
  }
  ) {}

  async log(entry: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    await this.db.insert(schema.auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      metadata: entry.metadata ?? {},
      ipAddress: entry.ipAddress ?? null,
      createdAt: new Date(),
    });
  }

  async findAll(opts: AuditQueryOptions = {}) {
    const { userId, action, resource, from, to, page = 1, limit = 50 } = opts;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (userId) conditions.push(eq(schema.auditLogs.userId, userId));
    if (action) conditions.push(eq(schema.auditLogs.action, action));
    if (resource) conditions.push(eq(schema.auditLogs.resource, resource));
    if (from) conditions.push(gte(schema.auditLogs.createdAt, from));
    if (to) conditions.push(lte(schema.auditLogs.createdAt, to));

    const rows = await this.db
      .select()
      .from(schema.auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }
}
