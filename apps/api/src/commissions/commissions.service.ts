import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { commissions } from '../database/schema';
import { DrizzleService } from '../database/database.module';

type CommissionRow = {
  id: string;
  type: string;
  referenceId: string | null;
  rate: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CommissionsService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  async findAll(type?: string): Promise<CommissionRow[]> {
    let query = (this.db as any).select().from(commissions);
    if (type) query = query.where(eq(commissions.type, type));
    return query.orderBy(commissions.type, commissions.createdAt);
  }

  async findById(id: string): Promise<CommissionRow> {
    const [commission] = await (this.db as any)
      .select().from(commissions).where(eq(commissions.id, id)).limit(1);
    if (!commission) throw new NotFoundException(`Comisión '${id}' no encontrada`);
    return commission;
  }

  async create(dto: {
    type: 'global' | 'category' | 'vendor';
    referenceId?: string;
    rate: string;
  }): Promise<CommissionRow> {
    const rate = parseFloat(dto.rate);
    if (rate < 0 || rate > 1) {
      throw new ConflictException('El rate debe estar entre 0 y 1');
    }

    const [commission] = await (this.db as any)
      .insert(commissions)
      .values({
        id: createId(),
        type: dto.type,
        referenceId: dto.referenceId ?? null,
        rate: dto.rate,
      })
      .returning();

    return commission;
  }

  async update(id: string, dto: { rate?: string }): Promise<CommissionRow> {
    await this.findById(id);

    if (dto.rate) {
      const rate = parseFloat(dto.rate);
      if (rate < 0 || rate > 1) {
        throw new ConflictException('El rate debe estar entre 0 y 1');
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.rate !== undefined) updateData['rate'] = dto.rate;

    const [updated] = await (this.db as any)
      .update(commissions)
      .set(updateData)
      .where(eq(commissions.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<{ deleted: string }> {
    await this.findById(id);
    await (this.db as any).delete(commissions).where(eq(commissions.id, id));
    return { deleted: id };
  }

  // Cascada: vendor-specific → category-specific → global
  async getEffectiveRate(storeId: string, categoryId?: string): Promise<string> {
    // 1. Vendor-specific
    const [vendorCommission] = await (this.db as any)
      .select().from(commissions)
      .where(eq(commissions.referenceId, storeId))
      .limit(1);

    if (vendorCommission) return vendorCommission.rate;

    // 2. Category-specific
    if (categoryId) {
      const [categoryCommission] = await (this.db as any)
        .select().from(commissions)
        .where(eq(commissions.referenceId, categoryId))
        .limit(1);

      if (categoryCommission) return categoryCommission.rate;
    }

    // 3. Global (fallback)
    const [globalCommission] = await (this.db as any)
      .select().from(commissions)
      .where(eq(commissions.type, 'global'))
      .limit(1);

    return globalCommission?.rate ?? '0.1000';
  }
}
