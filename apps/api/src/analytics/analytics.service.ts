import { Injectable } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DrizzleService } from '../database/database.module';
import * as schema from '../database/schema';
import {
  eq,
  and,
  gte,
  lte,
  sum,
  count,
  avg,
  desc,
  sql,
} from 'drizzle-orm';

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  private get db(): NeonHttpDatabase<typeof schema> {
    return this.drizzleService.db;
  }

  // ─── SELLER ANALYTICS ────────────────────────────────────────────────────────

  /**
   * Resumen de revenue, pedidos totales y ticket promedio para un seller.
   */
  async getSellerSummary(storeId: string, range: DateRangeFilter = {}) {
    const conditions = [eq(schema.products.storeId, storeId)];
    if (range.from) conditions.push(gte(schema.orders.createdAt, range.from));
    if (range.to) conditions.push(lte(schema.orders.createdAt, range.to));

    const [result] = await this.db
      .select({
        totalRevenue: sum(sql<number>`(${schema.orderItems.quantity} * ${schema.orderItems.price})`),
        totalOrders: count(schema.orders.id),
        avgOrderValue: avg(schema.orderItems.subtotal),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(and(...conditions));

    const summary = result ?? { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    return {
      totalRevenue: Number(summary.totalRevenue ?? 0),
      totalOrders: Number(summary.totalOrders ?? 0),
      avgOrderValue: Number(summary.avgOrderValue ?? 0),
    };
  }

  /**
   * Top N productos por revenue para un store.
   */
  async getSellerTopProducts(
    storeId: string,
    range: DateRangeFilter = {},
    limit = 10,
  ) {
    const conditions = [eq(schema.products.storeId, storeId)];
    if (range.from) conditions.push(gte(schema.orders.createdAt, range.from));
    if (range.to) conditions.push(lte(schema.orders.createdAt, range.to));

    const rows = await this.db
      .select({
        productId: schema.orderItems.productId,
        productName: schema.products.name,
        totalSold: sum(schema.orderItems.quantity),
        totalRevenue: sum(
          sql<number>`${schema.orderItems.quantity} * ${schema.orderItems.price}`,
        ),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(
        schema.products,
        eq(schema.orderItems.productId, schema.products.id),
      )
      .where(and(...conditions))
      .groupBy(schema.orderItems.productId, schema.products.name)
      .orderBy(desc(sum(sql<number>`${schema.orderItems.quantity} * ${schema.orderItems.price}`)))
      .limit(limit);
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalSold: Number(r.totalSold ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
    }));
  }

  /**
   * Revenue diario agrupado por día para gráficas de seller.
   */
  async getSellerRevenueByDay(storeId: string, range: DateRangeFilter = {}) {
    const conditions = [eq(schema.products.storeId, storeId)];
    if (range.from) conditions.push(gte(schema.orders.createdAt, range.from));
    if (range.to) conditions.push(lte(schema.orders.createdAt, range.to));

    const rows = await this.db
      .select({
        day: sql<string>`DATE(${schema.orders.createdAt})`,
        revenue: sum(sql<number>`(${schema.orderItems.quantity} * ${schema.orderItems.price})`),
        orders: count(schema.orderItems.orderId),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(and(...conditions))
      .groupBy(sql`DATE(${schema.orders.createdAt})`)
      .orderBy(sql`DATE(${schema.orders.createdAt})`);
    return rows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
    }));
  }

  // ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

  /**
   * Resumen global: GMV, pedidos, stores activos, usuarios totales.
   */
  async getAdminSummary(range: DateRangeFilter = {}) {
    const orderConditions: ReturnType<typeof eq>[] = [];
    if (range.from)
      orderConditions.push(gte(schema.orders.createdAt, range.from) as ReturnType<typeof eq>);
    if (range.to)
      orderConditions.push(lte(schema.orders.createdAt, range.to) as ReturnType<typeof eq>);

    const [orderStats] = await this.db
      .select({
        gmv: sum(schema.orders.totalAmount),
        totalOrders: count(schema.orders.id),
      })
      .from(schema.orders)
      .where(orderConditions.length ? and(...orderConditions) : undefined);

    const [storeStats] = await this.db
      .select({ activeStores: count(schema.stores.id) })
      .from(schema.stores)
      .where(eq(schema.stores.status, 'active' as never));

    const [userStats] = await this.db
      .select({ totalUsers: count(schema.users.id) })
      .from(schema.users);

    const orderSummary = orderStats ?? { gmv: 0, totalOrders: 0 };
    const storeSummary = storeStats ?? { activeStores: 0 };
    const userSummary = userStats ?? { totalUsers: 0 };

    return {
      gmv: Number(orderSummary.gmv ?? 0),
      totalOrders: Number(orderSummary.totalOrders ?? 0),
      activeStores: Number(storeSummary.activeStores ?? 0),
      totalUsers: Number(userSummary.totalUsers ?? 0),
    };
  }

  /**
   * Top stores por GMV en el rango.
   */
  async getAdminTopStores(range: DateRangeFilter = {}, limit = 10) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (range.from)
      conditions.push(gte(schema.orders.createdAt, range.from) as ReturnType<typeof eq>);
    if (range.to)
      conditions.push(lte(schema.orders.createdAt, range.to) as ReturnType<typeof eq>);

    const rows = await this.db
      .select({
        storeId: schema.products.storeId,
        storeName: schema.stores.name,
        gmv: sum(sql<number>`(${schema.orderItems.quantity} * ${schema.orderItems.price})`),
        orderCount: count(schema.orderItems.orderId),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(schema.products.storeId, schema.stores.name)
      .orderBy(desc(sum(sql<number>`(${schema.orderItems.quantity} * ${schema.orderItems.price})`)))
      .limit(limit);

    return rows.map((r) => ({
      storeId: r.storeId,
      storeName: r.storeName,
      gmv: Number(r.gmv ?? 0),
      orderCount: Number(r.orderCount ?? 0),
    }));
  }

  /**
   * GMV diario global para gráficas de admin.
   */
  async getAdminGmvByDay(range: DateRangeFilter = {}) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (range.from)
      conditions.push(gte(schema.orders.createdAt, range.from) as ReturnType<typeof eq>);
    if (range.to)
      conditions.push(lte(schema.orders.createdAt, range.to) as ReturnType<typeof eq>);

    const rows = await this.db
      .select({
        day: sql<string>`DATE(${schema.orders.createdAt})`,
        gmv: sum(schema.orders.totalAmount),
        orders: count(schema.orders.id),
      })
      .from(schema.orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(sql`DATE(${schema.orders.createdAt})`)
      .orderBy(sql`DATE(${schema.orders.createdAt})`);

    return rows.map((r) => ({
      day: r.day,
      gmv: Number(r.gmv ?? 0),
      orders: Number(r.orders ?? 0),
    }));
  }

  /**
   * Distribución de órdenes por status.
   */
  async getAdminOrderStatusBreakdown(range: DateRangeFilter = {}) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (range.from)
      conditions.push(gte(schema.orders.createdAt, range.from) as ReturnType<typeof eq>);
    if (range.to)
      conditions.push(lte(schema.orders.createdAt, range.to) as ReturnType<typeof eq>);

    const rows = await this.db
      .select({
        status: schema.orders.status,
        total: count(schema.orders.id),
      })
      .from(schema.orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(schema.orders.status);

    return rows;
  }
}
