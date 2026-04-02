import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { returns, orders } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import Stripe from 'stripe';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  private stripe: Stripe;

  constructor(private readonly db: DatabaseService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-01-27.acacia',
    });
  }

  async create(dto: CreateReturnDto, buyerId: string) {
    // Verify order belongs to buyer and is delivered
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
        evidence: dto.evidence ?? null,
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

  async findAll(userId: string, role: string) {
    const data =
      role === 'admin'
        ? await this.db.client.select().from(returns)
        : await this.db.client
            .select()
            .from(returns)
            .where(eq(returns.sellerId, userId));
    return { data };
  }

  async findOne(id: string, userId: string, role: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);
    const isParticipant =
      role === 'admin' ||
      returnRecord.buyerId === userId ||
      returnRecord.sellerId === userId;
    if (!isParticipant) throw new ForbiddenException('Access denied');
    return { data: returnRecord };
  }

  async approve(id: string, userId: string, role: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);
    if (role !== 'admin' && returnRecord.sellerId !== userId) {
      throw new ForbiddenException('Not your return to approve');
    }
    const [updated] = await this.db.client
      .update(returns)
      .set({ status: 'approved' })
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
    if (role !== 'admin' && returnRecord.sellerId !== userId) {
      throw new ForbiddenException('Not your return to reject');
    }
    const [updated] = await this.db.client
      .update(returns)
      .set({ status: 'rejected', rejectionReason: reason })
      .where(eq(returns.id, id))
      .returning();
    return { data: updated };
  }

  async refund(id: string, _adminId: string) {
    const [returnRecord] = await this.db.client
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    if (!returnRecord) throw new NotFoundException(`Return ${id} not found`);
    if (returnRecord.status !== 'approved') {
      throw new BadRequestException('Return must be approved before refunding');
    }
    if (!returnRecord.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment intent linked to this return');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: returnRecord.stripePaymentIntentId,
    });

    const [updated] = await this.db.client
      .update(returns)
      .set({ status: 'refunded', stripeRefundId: refund.id })
      .where(eq(returns.id, id))
      .returning();

    return { data: updated };
  }
}
