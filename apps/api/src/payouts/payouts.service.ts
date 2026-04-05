import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, gte, lte, desc, sum } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { payouts, payoutItems, orderItems, orders, stores } from '../database/schema';
import { DrizzleService } from '../database/database.module';

type PayoutRow = {
  id: string;
  sellerId: string;
  storeId: string | null;
  status: 'pending' | 'paid' | 'failed';
  gross: string;
  commission: string;
  net: string;
  periodStart: Date;
  periodEnd: Date;
  stripeTransferId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PayoutsService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  async findAll(storeId?: string): Promise<PayoutRow[]> {
    let query = (this.db as any).select().from(payouts);
    if (storeId) query = query.where(eq(payouts.storeId, storeId));
    return query.orderBy(desc(payouts.createdAt));
  }

  async findById(id: string): Promise<PayoutRow> {
    const [payout] = await (this.db as any)
      .select().from(payouts).where(eq(payouts.id, id)).limit(1);
    if (!payout) throw new NotFoundException(`Payout '${id}' no encontrado`);
    return payout;
  }

  async calculatePendingBalance(storeId: string, periodStart: Date, periodEnd: Date) {
    const result = await (this.db as any)
      .select({
        totalSubtotal: sum(orderItems.subtotal),
        totalCommission: sum(orderItems.commissionAmount),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orderItems.storeId, storeId),
        eq(orders.status, 'delivered'),
        gte(orders.deliveredAt, periodStart),
        lte(orders.deliveredAt, periodEnd),
      ));

    const gross = result[0]?.totalSubtotal ?? '0';
    const commission = result[0]?.totalCommission ?? '0';
    const net = (parseFloat(gross) - parseFloat(commission)).toFixed(2);

    return { gross, commission, net };
  }

  async processPayout(
    storeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PayoutRow & { items: unknown[] }> {
    const [store] = await (this.db as any)
      .select({ id: stores.id, sellerId: stores.userId, stripeAccountId: stores.stripeAccountId })
      .from(stores).where(eq(stores.id, storeId)).limit(1);

    if (!store) throw new NotFoundException(`Tienda '${storeId}' no encontrada`);

    const balance = await this.calculatePendingBalance(storeId, periodStart, periodEnd);

    if (parseFloat(balance.net) <= 0) {
      throw new ForbiddenException('No hay balance pendiente para pagar');
    }

    const [payout] = await (this.db as any)
      .insert(payouts)
      .values({
        id: createId(),
        sellerId: store.sellerId,
        storeId,
        gross: balance.gross,
        commission: balance.commission,
        net: balance.net,
        status: store.stripeAccountId ? 'paid' : 'pending',
        stripeTransferId: null,
        periodStart,
        periodEnd,
        notes: store.stripeAccountId ? null : 'Stripe Connect no configurado',
      })
      .returning();

    const items = await (this.db as any)
      .select({
        id: orderItems.id,
        name: orderItems.name,
        subtotal: orderItems.subtotal,
        commissionAmount: orderItems.commissionAmount,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orderItems.storeId, storeId),
        eq(orders.status, 'delivered'),
        gte(orders.deliveredAt, periodStart),
        lte(orders.deliveredAt, periodEnd),
      ));

    for (const item of items) {
      await (this.db as any).insert(payoutItems).values({
        id: createId(),
        payoutId: payout.id,
        orderId: item.id,
        amount: item.subtotal,
      });
    }

    return { ...payout, items };
  }

  async getAdminSummary() {
    const result = await (this.db as any)
      .select({ totalPaid: sum(payouts.net) })
      .from(payouts);
    return { totalPaid: result[0]?.totalPaid ?? '0' };
  }
}
