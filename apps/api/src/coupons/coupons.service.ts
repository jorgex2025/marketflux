import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { coupons, couponUsage } from '../database/schema';
import { DrizzleService } from '../database/database.module';

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: string;
  minOrderAmount: string | null;
  usageLimit: string | null;
  usedCount: string | null;
  active: boolean | null;
  storeId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CouponsService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  async findAll(storeId?: string): Promise<CouponRow[]> {
    let query = (this.db as any).select().from(coupons);
    if (storeId) query = query.where(eq(coupons.storeId, storeId));
    return query.orderBy(desc(coupons.createdAt));
  }

  async findById(id: string): Promise<CouponRow> {
    const [coupon] = await (this.db as any)
      .select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!coupon) throw new NotFoundException(`Cupón '${id}' no encontrado`);
    return coupon;
  }

  async create(dto: {
    code: string;
    type: 'percentage' | 'fixed';
    value: string;
    minOrderAmount?: string;
    usageLimit?: string;
    storeId?: string;
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<CouponRow> {
    const [existing] = await (this.db as any)
      .select({ id: coupons.id }).from(coupons)
      .where(eq(coupons.code, dto.code.toUpperCase())).limit(1);
    if (existing) throw new ConflictException(`Código '${dto.code}' ya existe`);

    const [coupon] = await (this.db as any)
      .insert(coupons)
      .values({
        id: createId(),
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? null,
        usageLimit: dto.usageLimit ?? null,
        usedCount: '0',
        active: true,
        storeId: dto.storeId ?? null,
        startsAt: dto.startsAt ?? null,
        endsAt: dto.endsAt ?? null,
      })
      .returning();

    return coupon;
  }

  async update(id: string, dto: {
    value?: string;
    active?: boolean;
    usageLimit?: string;
    startsAt?: Date;
    endsAt?: Date;
  }, requesterStoreId?: string): Promise<CouponRow> {
    const coupon = await this.findById(id);

    if (requesterStoreId && coupon.storeId !== requesterStoreId) {
      throw new ForbiddenException('No tienes permisos para editar este cupón');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.value !== undefined) updateData['value'] = dto.value;
    if (dto.active !== undefined) updateData['active'] = dto.active;
    if (dto.usageLimit !== undefined) updateData['usageLimit'] = dto.usageLimit;
    if (dto.startsAt !== undefined) updateData['startsAt'] = dto.startsAt;
    if (dto.endsAt !== undefined) updateData['endsAt'] = dto.endsAt;

    const [updated] = await (this.db as any)
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, requesterStoreId?: string): Promise<{ deleted: string }> {
    const coupon = await this.findById(id);

    if (requesterStoreId && coupon.storeId !== requesterStoreId) {
      throw new ForbiddenException('No tienes permisos para eliminar este cupón');
    }

    await (this.db as any).delete(coupons).where(eq(coupons.id, id));
    return { deleted: id };
  }

  async validate(code: string, cartTotal: string): Promise<{
    valid: boolean;
    discount: string;
    error?: string;
  }> {
    const now = new Date();
    const [coupon] = await (this.db as any)
      .select().from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) return { valid: false, discount: '0', error: 'COUPON_NOT_FOUND' };
    if (!coupon.active) return { valid: false, discount: '0', error: 'COUPON_INACTIVE' };
    if (coupon.startsAt && coupon.startsAt > now) return { valid: false, discount: '0', error: 'COUPON_NOT_STARTED' };
    if (coupon.endsAt && coupon.endsAt < now) return { valid: false, discount: '0', error: 'COUPON_EXPIRED' };
    if (coupon.usageLimit && parseInt(coupon.usedCount ?? '0') >= parseInt(coupon.usageLimit)) {
      return { valid: false, discount: '0', error: 'COUPON_LIMIT_REACHED' };
    }
    if (coupon.minOrderAmount && parseFloat(cartTotal) < parseFloat(coupon.minOrderAmount)) {
      return { valid: false, discount: '0', error: 'MIN_PURCHASE_NOT_MET' };
    }

    const value = parseFloat(coupon.value);
    const discount = coupon.type === 'percentage'
      ? (parseFloat(cartTotal) * value / 100).toFixed(2)
      : value.toFixed(2);

    return { valid: true, discount };
  }

  async getFlashSales(): Promise<CouponRow[]> {
    const now = new Date();
    return (this.db as any)
      .select().from(coupons)
      .where(and(
        eq(coupons.active, true),
        eq(coupons.type, 'percentage'),
        gte(coupons.value, '20'),
        lte(coupons.startsAt, now),
        gte(coupons.endsAt, now),
      ))
      .orderBy(desc(coupons.endsAt));
  }

  async incrementUsage(couponId: string): Promise<void> {
    await (this.db as any)
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
      .where(eq(coupons.id, couponId));
  }
}
