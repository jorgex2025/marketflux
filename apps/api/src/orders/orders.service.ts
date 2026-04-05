import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../database/schema/index';
import { DrizzleService } from '../database/database.module';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly cartService: CartService,
  ) {}

  private get db(): NeonHttpDatabase<typeof schema> {
    return this.drizzleService.db;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cartResult = await this.cartService.getCart(userId);
    const cart = cartResult.data as any;
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock for all items before any write
    for (const item of cart.items) {
      const available = await this.cartService.getAvailableStock(
        item.productId,
        item.variantId ?? undefined,
      );
      if (available < item.quantity) {
        throw new ConflictException(
          `Insufficient stock for product ${item.productId}. Available: ${available}, requested: ${item.quantity}`,
        );
      }
    }

    // Resolve commission rate (global fallback)
    const config = await this.db.query.marketplaceConfig.findFirst({
      where: eq(schema.marketplaceConfig.key, 'commissionGlobalRate'),
    });
    const globalRate = config?.value ?? '0.10';

    // Calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += Number(item.unitPrice) * item.quantity;
    }

    // Apply coupon if present
    let discountAmount = 0;
    let coupon: typeof schema.coupons.$inferSelect | undefined;
    if (cart.couponCode) {
      coupon = await this.db.query.coupons.findFirst({
        where: eq(schema.coupons.code, cart.couponCode),
      });
      if (coupon && coupon.active) {
        if (coupon.type === 'percentage') {
          discountAmount = (subtotal * Number(coupon.value)) / 100;
        } else {
          discountAmount = Number(coupon.value);
        }
      }
    }

    const totalAmount = subtotal - discountAmount;

    // Create order
    const [order] = await this.db
      .insert(schema.orders)
      .values({
        userId,
        status: 'pending',
        subtotal: subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        couponId: cart.couponId ?? null,
        shippingMethodId: dto.shippingMethodId ?? null,
        shippingAddress: dto.shippingAddress ?? '',
        paymentMethod: dto.paymentMethod ?? 'pending',
      })
      .returning();

    if (!order) {
      throw new Error('Failed to create order');
    }

    // Create order items
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    for (const item of cart.items) {
      const itemSubtotal = (Number(item.price) * item.quantity).toFixed(2);
      const commissionAmount = (Number(itemSubtotal) * Number(globalRate)).toFixed(2);
      const [orderItem] = await this.db
        .insert(schema.orderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          storeId: item.storeId,
          name: item.name,
          sku: item.sku ?? null,
          attributes: item.attributes ?? null,
          quantity: item.quantity,
          price: item.price,
          commissionRate: globalRate,
          commissionAmount,
          subtotal: itemSubtotal,
        })
        .returning();

      await this.db.insert(schema.inventoryReservations).values({
        productId: item.productId,
        variantId: item.variantId ?? null,
        orderId: order.id,
        quantity: item.quantity,
        status: 'reserved',
        expiresAt,
      });
    }

    if (coupon) {
      await this.db
        .update(schema.coupons)
        .set({ usedCount: sql`${schema.coupons.usedCount}::integer + 1` })
        .where(eq(schema.coupons.id, coupon.id));
    }

    return { data: order };
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const orders = await this.db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      with: { items: true },
      limit,
      offset,
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    const [countResult] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId));
    const count = countResult?.count ?? 0;
    return {
      data: orders,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: { items: { with: { product: true, variant: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');
    return { data: order };
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.db.query.orders.findFirst({
      where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    const reservations = await this.db.query.inventoryReservations.findMany({
      where: and(
        eq(schema.inventoryReservations.orderId, orderId),
        eq(schema.inventoryReservations.status, 'reserved'),
      ),
    });

    for (const reservation of reservations) {
      await this.db
        .update(schema.inventoryReservations)
        .set({ status: 'released' })
        .where(eq(schema.inventoryReservations.id, reservation.id));

      if (reservation.variantId) {
        await this.db
          .update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} + ${reservation.quantity}` })
          .where(eq(schema.productVariants.id, reservation.variantId));
      } else {
        await this.db
          .update(schema.products)
          .set({ stock: sql`${schema.products.stock} + ${reservation.quantity}` })
          .where(eq(schema.products.id, reservation.productId));
      }
    }

    const [updated] = await this.db
      .update(schema.orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId))
      .returning();

    return { data: updated };
  }

  async isReviewEligible(orderId: string, itemId: string, userId: string) {
    const order = await this.db.query.orders.findFirst({
      where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)),
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'delivered') {
      return { data: { eligible: false, reason: 'Order not delivered' } };
    }
    const item = await this.db.query.orderItems.findFirst({
      where: and(eq(schema.orderItems.id, itemId), eq(schema.orderItems.orderId, orderId)),
    });
    if (!item) throw new NotFoundException('Order item not found');
    const existing = await this.db.query.reviews.findFirst({
      where: and(
        eq(schema.reviews.productId, item.productId),
        eq(schema.reviews.userId, userId),
      ),
    });
    return { data: { eligible: !existing, reason: existing ? 'Already reviewed' : null } };
  }

  async confirmOrderPayment(orderId: string) {
    const reservations = await this.db.query.inventoryReservations.findMany({
      where: and(
        eq(schema.inventoryReservations.orderId, orderId),
        eq(schema.inventoryReservations.status, 'reserved'),
      ),
    });

    for (const reservation of reservations) {
      await this.db
        .update(schema.inventoryReservations)
        .set({ status: 'confirmed' })
        .where(eq(schema.inventoryReservations.id, reservation.id));

      if (reservation.variantId) {
        await this.db
          .update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} - ${reservation.quantity}` })
          .where(eq(schema.productVariants.id, reservation.variantId));
      } else {
        await this.db
          .update(schema.products)
          .set({ stock: sql`${schema.products.stock} - ${reservation.quantity}` })
          .where(eq(schema.products.id, reservation.productId));
      }
    }

    await this.db
      .update(schema.orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));
  }
}
