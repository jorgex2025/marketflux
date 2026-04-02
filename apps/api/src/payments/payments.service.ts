import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '../database/drizzle.decorator';
import type { DrizzleDb } from '../database/drizzle.types';
import { eq } from 'drizzle-orm';
import {
  orders,
  orderItems,
  inventoryReservations,
  products,
  productVariants,
  users,
} from '../database/schema';
import Stripe from 'stripe';
import type { Request } from 'express';
import type { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;

  constructor(
    @InjectDrizzle() private readonly db: DrizzleDb,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' });
  }

  // ─── Crear Stripe Checkout Session ─────────────────────────────────────

  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    userId: string,
  ): Promise<{ url: string }> {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, dto.orderId),
      with: { items: { with: { product: true } } },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new BadRequestException('No autorizado');
    if (order.status !== 'pending') {
      throw new BadRequestException('La orden no está en estado pendiente');
    }

    const webUrl =
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(item.unitPrice) * 100),
          product_data: {
            name: item.product?.name ?? `Producto ${item.productId}`,
            ...(item.product?.imageUrls?.[0]
              ? { images: [item.product.imageUrls[0]] }
              : {}),
          },
        },
      }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url:
        dto.successUrl ??
        `${webUrl}/orders/${order.id}?payment=success`,
      cancel_url:
        dto.cancelUrl ?? `${webUrl}/checkout?payment=cancelled`,
      metadata: { orderId: order.id, userId },
      ...(order.discountAmount && Number(order.discountAmount) > 0
        ? {
            discounts: [
              {
                coupon: await this.getOrCreateStripeCoupon(
                  order.discountAmount,
                ),
              },
            ],
          }
        : {}),
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Stripe no devolveró URL de pago',
      );
    }

    // Guardar stripeSessionId en la orden
    await this.db
      .update(orders)
      .set({ stripeSessionId: session.id })
      .where(eq(orders.id, order.id));

    return { url: session.url };
  }

  // ─── Webhook Stripe ─────────────────────────────────────────────────────

  async handleWebhook(req: RawBodyRequest<Request>): Promise<void> {
    const sig = req.headers['stripe-signature'];
    if (!sig || !req.rawBody) {
      throw new BadRequestException('Firma Stripe ausente o cuerpo vacío');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        this.webhookSecret,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Firma inválida';
      this.logger.warn(`Webhook signature error: ${msg}`);
      throw new BadRequestException(`Webhook error: ${msg}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'checkout.session.expired':
        await this.onCheckoutExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      default:
        this.logger.debug(`Evento no manejado: ${event.type}`);
    }
  }

  // ─── Handlers internos ──────────────────────────────────────────────────

  private async onCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    if (!order || order.status !== 'pending') return;

    // 1. Confirmar orden
    await this.db
      .update(orders)
      .set({ status: 'confirmed', stripePaymentIntentId: session.payment_intent as string })
      .where(eq(orders.id, orderId));

    // 2. Descontar stock real y liberar reservas
    for (const item of order.items) {
      if (item.variantId) {
        await this.db
          .update(productVariants)
          .set({
            stock: this.db
              .select({ stock: productVariants.stock })
              .from(productVariants)
              .where(eq(productVariants.id, item.variantId))
              .then(() => undefined) as unknown as number,
          })
          .where(eq(productVariants.id, item.variantId));
        // Stock real usando SQL expr
        await this.db.execute(
          `UPDATE product_variants SET stock = stock - ${item.qty} WHERE id = '${item.variantId}'`,
        );
      } else {
        await this.db.execute(
          `UPDATE products SET stock = stock - ${item.qty} WHERE id = '${item.productId}'`,
        );
      }

      // Liberar reservas del order item
      await this.db
        .update(inventoryReservations)
        .set({ status: 'confirmed' })
        .where(eq(inventoryReservations.orderId, orderId));
    }

    this.logger.log(`Orden ${orderId} confirmada via Stripe webhook`);
  }

  private async onCheckoutExpired(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    if (!order || order.status !== 'pending') return;

    // Cancelar orden y liberar reservas
    await this.db
      .update(orders)
      .set({ status: 'cancelled' })
      .where(eq(orders.id, orderId));

    await this.db
      .update(inventoryReservations)
      .set({ status: 'released' })
      .where(eq(inventoryReservations.orderId, orderId));

    // Restaurar stock
    const orderWithItems = await this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    for (const item of orderWithItems?.items ?? []) {
      if (item.variantId) {
        await this.db.execute(
          `UPDATE product_variants SET stock = stock + ${item.qty} WHERE id = '${item.variantId}'`,
        );
      } else {
        await this.db.execute(
          `UPDATE products SET stock = stock + ${item.qty} WHERE id = '${item.productId}'`,
        );
      }
    }

    this.logger.log(`Orden ${orderId} expirada, reservas liberadas`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getOrCreateStripeCoupon(
    discountAmount: string | number,
  ): Promise<string> {
    const amount = Math.round(Number(discountAmount) * 100);
    const coupon = await this.stripe.coupons.create({
      amount_off: amount,
      currency: 'usd',
      duration: 'once',
    });
    return coupon.id;
  }
}
