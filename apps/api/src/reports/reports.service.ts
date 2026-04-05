import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { reports, orders, orderItems, users } from '../database/schema';
import { DrizzleService } from '../database/database.module';

@Injectable()
export class ReportsService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  async findAll(type?: string) {
    let query = (this.db as any).select().from(reports);
    if (type) query = query.where(eq(reports.type, type));
    return query.orderBy(desc(reports.createdAt));
  }

  async findById(id: string) {
    const [report] = await (this.db as any)
      .select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async create(dto: {
    type: string;
    generatedBy: string;
    data?: Record<string, unknown>;
  }) {
    const [report] = await (this.db as any)
      .insert(reports)
      .values({
        id: createId(),
        type: dto.type,
        generatedBy: dto.generatedBy,
        data: dto.data ?? null,
      })
      .returning();

    return report;
  }

  async generateSalesReport(generatedBy: string, periodStart: Date, periodEnd: Date) {
    const result = await (this.db as any)
      .select({
        totalOrders: sql`count(distinct ${orders.id})`,
        totalRevenue: sql`sum(${orderItems.subtotal})`,
        totalCommission: sql`sum(${orderItems.commissionAmount})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.createdAt} >= ${periodStart} AND ${orders.createdAt} <= ${periodEnd}`);

    const data = {
      periodStart,
      periodEnd,
      totalOrders: result[0]?.totalOrders ?? 0,
      totalRevenue: result[0]?.totalRevenue ?? '0',
      totalCommission: result[0]?.totalCommission ?? '0',
    };

    return this.create({ type: 'sales', generatedBy, data });
  }

  async remove(id: string): Promise<{ deleted: string }> {
    await this.findById(id);
    await (this.db as any).delete(reports).where(eq(reports.id, id));
    return { deleted: id };
  }
}
