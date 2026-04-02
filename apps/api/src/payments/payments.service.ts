import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema/index';
import { OrdersService } from '../orders/orders.service';
import Stripe from 'stripe';
import type { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;

  constructor(
    @Inject(DATABASE_TOKEN)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    const secretKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' });
  }

  // ─── Crear Stripe Checkout Session ───────────────────────────────────

  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    userId: string,
  ): Promise<{ url: string }> {
    const order = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, dto.orderId),
      with: { items: { with: { product: true } } },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new BadRequestException('No autorizado');
    if (order.status !== 'pending') {
      throw new BadRequestException('La orden no está en estado pendiente');
    }

    const webUrl = this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(item.unitPrice) * 100),
          product_data: {
            name: item.product?.name ?? `Producto ${item.productId}`,
          },
        },
      }));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: dto.successUrl ?? `${webUrl}/orders/${order.id}?payment=success`,
      cancel_url: dto.cancelUrl ?? `${webUrl}/checkout?payment=cancelled`,
      metadata: { orderId: order.id, userId },
    };

    // Descuento: idempotency key basada en orderId para evitar cupones Stripe duplicados
    if (order.discountAmount && Number(order.discountAmount) > 0) {
      const couponId = await this.getOrCreateStripeCoupon(
        order.discountAmount,
        order.id,
      );
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams, {
      // Idempotency key a nivel de session: reuso seguro si el usuario recarga
      idempotencyKey: `checkout-session-${order.id}`,
    });

    if (!session.url) {
      throw new InternalServerErrorException('Stripe no devolvió URL de pago');
    }

    // Guardar stripeSessionId en la orden
    await this.db
      .update(schema.orders)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ stripeSessionId: session.id } as any)
      .where(eq(schema.orders.id, order.id));

    return { url: session.url };
  }

  // ─── Webhook Stripe ────────────────────────────────────────────────

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

  // ─── Handlers internos ────────────────────────────────────────────

  private async onCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    // Guard idempotente: si ya no está pending, ignorar
    const order = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });
    if (!order || order.status !== 'pending') return;

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

    // Operación atómica: guardar paymentIntentId + confirmar stock en una sola
    // transacción lógica a través del método de OrdersService que ya maneja
    // el status final. Primero actualizamos el campo Stripe (campo futuro),
    // luego delegamos la transición de estado al servicio de dominio.
    if (paymentIntentId) {
      await this.db
        .update(schema.orders)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ stripePaymentIntentId: paymentIntentId } as any)
        .where(eq(schema.orders.id, orderId));
    }

    // confirmOrderPayment cambia status a 'paid' y descuenta stock real
    // Si lanza, Stripe reintentará el webhook y el guard de status lo protegerá
    await this.ordersService.confirmOrderPayment(orderId);
    this.logger.log(`Orden ${orderId} confirmada via Stripe webhook`);
  }

  private async onCheckoutExpired(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });
    if (!order || order.status !== 'pending') return;

    // Delegar cancelación completa al servicio de dominio
    await this.ordersService.cancelOrder(orderId, order.userId);
    this.logger.log(`Orden ${orderId} expirada, reservas liberadas`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  /**
   * Crea un cupón Stripe con idempotency key basada en orderId.
   * Retries seguros: Stripe devuelve el mismo cupón si ya fue creado.
   */
  private async getOrCreateStripeCoupon(
    discountAmount: string | number,
    orderId: string,
  ): Promise<string> {
    const amount = Math.round(Number(discountAmount) * 100);
    const coupon = await this.stripe.coupons.create(
      {
        amount_off: amount,
        currency: 'usd',
        duration: 'once',
      },
      { idempotencyKey: `coupon-${orderId}` },
    );
    return coupon.id;
  }
}
