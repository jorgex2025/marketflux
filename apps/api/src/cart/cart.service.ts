import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../database/schema/index';
import { DrizzleService } from '../database/database.module';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Injectable()
export class CartService {
  constructor(private readonly drizzleService: DrizzleService) {}

  private get db(): NeonHttpDatabase<typeof schema> {
    return this.drizzleService.db;
  }

  private async getOrCreateCart(userId: string) {
    let cart = await this.db.query.carts.findFirst({
      where: eq(schema.carts.userId, userId),
      with: { items: { with: { product: true, variant: true } } },
    });
    if (!cart) {
      const [newCart] = await this.db
        .insert(schema.carts)
        .values({ userId })
        .returning();
      cart = { ...newCart, items: [] };
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return { data: cart };
  }

  async addItem(dto: AddCartItemDto, userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, dto.productId),
    });
    if (!product) throw new NotFoundException('Product not found');

    const availableStock = await this.getAvailableStock(dto.productId, dto.variantId);
    if (availableStock < dto.quantity) {
      throw new ConflictException(`Insufficient stock. Available: ${availableStock}`);
    }

    const existing = await this.db.query.cartItems.findFirst({
      where: and(
        eq(schema.cartItems.cartId, cart.id),
        eq(schema.cartItems.productId, dto.productId),
        dto.variantId
          ? eq(schema.cartItems.variantId, dto.variantId)
          : sql`${schema.cartItems.variantId} IS NULL`,
      ),
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (newQty > availableStock) throw new ConflictException('Not enough stock for requested quantity');
      const [updated] = await this.db
        .update(schema.cartItems)
        .set({ quantity: newQty })
        .where(eq(schema.cartItems.id, existing.id))
        .returning();
      return { data: updated };
    }

    const unitPrice = dto.variantId
      ? (await this.db.query.productVariants.findFirst({ where: eq(schema.productVariants.id, dto.variantId) }))?.price ?? product.price
      : product.price;

    const [item] = await this.db
      .insert(schema.cartItems)
      .values({
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        quantity: dto.quantity,
        unitPrice,
      })
      .returning();
    return { data: item };
  }

  async updateItem(itemId: string, dto: UpdateCartItemDto, userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.db.query.cartItems.findFirst({
      where: and(eq(schema.cartItems.id, itemId), eq(schema.cartItems.cartId, cart.id)),
    });
    if (!item) throw new NotFoundException('Cart item not found');
    const availableStock = await this.getAvailableStock(item.productId, item.variantId ?? undefined);
    if (dto.quantity > availableStock) throw new ConflictException(`Insufficient stock. Available: ${availableStock}`);
    const [updated] = await this.db
      .update(schema.cartItems)
      .set({ quantity: dto.quantity })
      .where(eq(schema.cartItems.id, itemId))
      .returning();
    return { data: updated };
  }

  async removeItem(itemId: string, userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.db.query.cartItems.findFirst({
      where: and(eq(schema.cartItems.id, itemId), eq(schema.cartItems.cartId, cart.id)),
    });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.db.delete(schema.cartItems).where(eq(schema.cartItems.id, itemId));
    return { data: { deleted: true } };
  }

  async applyCoupon(dto: ApplyCouponDto, userId: string) {
    const now = new Date();
    const coupon = await this.db.query.coupons.findFirst({
      where: eq(schema.coupons.code, dto.code),
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.active) throw new BadRequestException('Coupon is not active');
    if (coupon.endsAt && coupon.endsAt < now) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit !== null && parseInt(coupon.usedCount) >= parseInt(coupon.usageLimit))
      throw new BadRequestException('Coupon usage limit reached');

    const cart = await this.getOrCreateCart(userId);
    const [updated] = await this.db
      .update(schema.carts)
      .set({ couponCode: dto.code })
      .where(eq(schema.carts.id, cart.id))
      .returning();
    return { data: updated };
  }

  async removeCoupon(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const [updated] = await this.db
      .update(schema.carts)
      .set({ couponCode: null })
      .where(eq(schema.carts.id, cart.id))
      .returning();
    return { data: updated };
  }

  async getAvailableStock(productId: string, variantId?: string): Promise<number> {
    if (variantId) {
      const variant = await this.db.query.productVariants.findFirst({
        where: eq(schema.productVariants.id, variantId),
      });
      const baseStock = variant?.stock ?? 0;
      const reserved = await this.db
        .select({ total: sql<number>`COALESCE(SUM(${schema.inventoryReservations.quantity}), 0)` })
        .from(schema.inventoryReservations)
        .where(
          and(
            eq(schema.inventoryReservations.variantId, variantId),
            eq(schema.inventoryReservations.status, 'reserved'),
          ),
        );
      return baseStock - Number(reserved[0]?.total ?? 0);
    }
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });
    const baseStock = product?.stock ?? 0;
    const reserved = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${schema.inventoryReservations.quantity}), 0)` })
      .from(schema.inventoryReservations)
      .where(
        and(
          eq(schema.inventoryReservations.productId, productId),
          sql`${schema.inventoryReservations.variantId} IS NULL`,
          eq(schema.inventoryReservations.status, 'reserved'),
        ),
      );
    return baseStock - Number(reserved[0]?.total ?? 0);
  }
}
