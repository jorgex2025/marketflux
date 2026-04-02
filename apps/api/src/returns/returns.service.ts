import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  returns,
  orders,
  orderItems,
  payments,
} from '../database/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { CreateReturnDto } from './dto/create-return.dto';

const STRIPE_API_VERSION = '2025-01-27.acacia' as const;

@Injectable()
export class ReturnsService {
  private stripe: Stripe;

  constructor(private readonly db: DatabaseService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  async create(dto: CreateReturnDto, buyerId: string) {
    const [order] = await this.db.client
      .select()
      .from(orders)
      .where(and(eq(orders.id, dto.orderId), eq(orders.userId, buyerId)));

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'delivered') {
      throw new BadRequestException(
        'Return can only be requested for delivered orders',
      );
    }

    const [returnRecord] = await this.db.client
      .insert(returns)
      .values({
        orderId: dto.orderId,
        buyerId,
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence ? [dto.evidence] : [],
        status: 'pending',
      })
      .returning();

    return { data: returnRecord };
  }

  async findMy(buyerId: string) {
    const data = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.buyerId, buyerId));
    return { data };
  }

  /**
   * Para sellers: filtra returns cuya order contiene items de sus productos.
   * La tabla returns NO tiene seller_id; el seller se deriva via
   * returns → orders → order_items → products → stores (userId = sellerId).
   */
  async findAll(userId: string, role: string) {
    if (role === 'admin') {
      const data = await this.db.client.select().from(returns);
      return { data };
    }

    // JOIN path: returns → orders → orderItems → products → stores
    const { products: productsTable, stores } =
      await import('../database/schema');

    const rows = await this.db.client
      .selectDistinct({ ret: returns })
      .from(returns)
      .innerJoin(orders, eq(orders.id, returns.orderId))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(productsTable, eq(productsTable.id, orderItems.productId))
      .innerJoin(
        stores,
        and(
          eq(stores.id, productsTable.storeId),
          eq(stores.userId, userId),
        ),
      );

    return { data: rows.map((r) => r.ret) };
  }

  async findOne(id: string, userId: string, role: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);

    // Participant check: admin | buyer | seller (via order ownership)
    if (role === 'admin' || returnRecord.buyerId === userId) {
      return { data: returnRecord };
    }

    // Check if seller owns any product in this order
    const { products: productsTable, stores } =
      await import('../database/schema');
    const [sellerRow] = await this.db.client
      .select({ storeId: stores.id })
      .from(orderItems)
      .innerJoin(productsTable, eq(productsTable.id, orderItems.productId))
      .innerJoin(
        stores,
        and(
          eq(stores.id, productsTable.storeId),
          eq(stores.userId, userId),
        ),
      )
      .where(eq(orderItems.orderId, returnRecord.orderId));

    if (!sellerRow) throw new ForbiddenException('Access denied');
    return { data: returnRecord };
  }

  async approve(id: string, userId: string, role: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);

    // Only admin bypasses seller check; seller ownership via order
    if (role !== 'admin') {
      const { products: productsTable, stores } =
        await import('../database/schema');
      const [sellerRow] = await this.db.client
        .select({ storeId: stores.id })
        .from(orderItems)
        .innerJoin(productsTable, eq(productsTable.id, orderItems.productId))
        .innerJoin(
          stores,
          and(
            eq(stores.id, productsTable.storeId),
            eq(stores.userId, userId),
          ),
        )
        .where(eq(orderItems.orderId, returnRecord.orderId));
      if (!sellerRow) throw new ForbiddenException('Not your return to approve');
    }

    const [updated] = await this.db.client
      .update(returns)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(returns.id, id))
      .returning();
    return { data: updated };
  }

  async reject(id: string, reason: string, userId: string, role: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);

    if (role !== 'admin') {
      const { products: productsTable, stores } =
        await import('../database/schema');
      const [sellerRow] = await this.db.client
        .select({ storeId: stores.id })
        .from(orderItems)
        .innerJoin(productsTable, eq(productsTable.id, orderItems.productId))
        .innerJoin(
          stores,
          and(
            eq(stores.id, productsTable.storeId),
            eq(stores.userId, userId),
          ),
        )
        .where(eq(orderItems.orderId, returnRecord.orderId));
      if (!sellerRow) throw new ForbiddenException('Not your return to reject');
    }

    const [updated] = await this.db.client
      .update(returns)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(returns.id, id))
      .returning();
    return { data: updated };
  }

  /**
   * Ejecuta refund vía Stripe usando el externalId (PaymentIntent ID)
   * guardado en la tabla payments para esta order.
   */
  async refund(id: string, _adminId: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);
    if (returnRecord.status !== 'approved') {
      throw new BadRequestException('Return must be approved before refunding');
    }

    // Buscar el PaymentIntent en la tabla payments (externalId = Stripe PI id)
    const [payment] = await this.db.client
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.orderId, returnRecord.orderId),
          eq(payments.provider, 'stripe'),
        ),
      );

    if (!payment?.externalId) {
      throw new BadRequestException(
        'No Stripe payment found for this order. Cannot refund.',
      );
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: payment.externalId,
    });

    const [updated] = await this.db.client
      .update(returns)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(returns.id, id))
      .returning();

    return { data: { ...updated, stripeRefundId: refund.id } };
  }
}
