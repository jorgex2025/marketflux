import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../database/schema/index';
import { DATABASE_TOKEN } from '../database/database.module';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DATABASE_TOKEN)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getStock(productId: string, sellerId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
      with: { variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const store = await this.db.query.stores.findFirst({
      where: and(
        eq(schema.stores.id, product.storeId),
        eq(schema.stores.userId, sellerId),
      ),
    });
    if (!store) throw new ForbiddenException('Not your product');
    return { data: { product, variants: product.variants } };
  }

  async updateProductStock(productId: string, dto: UpdateStockDto, sellerId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });
    if (!product) throw new NotFoundException('Product not found');
    const store = await this.db.query.stores.findFirst({
      where: and(
        eq(schema.stores.id, product.storeId),
        eq(schema.stores.userId, sellerId),
      ),
    });
    if (!store) throw new ForbiddenException('Not your product');
    const [updated] = await this.db
      .update(schema.products)
      .set({ stock: dto.stock })
      .where(eq(schema.products.id, productId))
      .returning();
    await this.checkAndTriggerAlert(productId, undefined, dto.stock);
    return { data: updated };
  }

  async updateVariantStock(productId: string, variantId: string, dto: UpdateStockDto, sellerId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });
    if (!product) throw new NotFoundException('Product not found');
    const store = await this.db.query.stores.findFirst({
      where: and(
        eq(schema.stores.id, product.storeId),
        eq(schema.stores.userId, sellerId),
      ),
    });
    if (!store) throw new ForbiddenException('Not your product');
    const [updated] = await this.db
      .update(schema.productVariants)
      .set({ stock: dto.stock })
      .where(and(eq(schema.productVariants.id, variantId), eq(schema.productVariants.productId, productId)))
      .returning();
    if (!updated) throw new NotFoundException('Variant not found');
    await this.checkAndTriggerAlert(productId, variantId, dto.stock);
    return { data: updated };
  }

  async getAlerts(sellerId: string) {
    const alerts = await this.db
      .select({
        alert: schema.inventoryAlerts,
        product: schema.products,
      })
      .from(schema.inventoryAlerts)
      .innerJoin(schema.products, eq(schema.inventoryAlerts.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(eq(schema.stores.userId, sellerId));
    return { data: alerts };
  }

  async createAlert(dto: CreateAlertDto, sellerId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, dto.productId),
    });
    if (!product) throw new NotFoundException('Product not found');
    const store = await this.db.query.stores.findFirst({
      where: and(
        eq(schema.stores.id, product.storeId),
        eq(schema.stores.userId, sellerId),
      ),
    });
    if (!store) throw new ForbiddenException('Not your product');
    const [alert] = await this.db
      .insert(schema.inventoryAlerts)
      .values({ productId: dto.productId, variantId: dto.variantId ?? null, threshold: dto.threshold })
      .returning();
    return { data: alert };
  }

  async deleteAlert(alertId: string, sellerId: string) {
    const [alert] = await this.db
      .select()
      .from(schema.inventoryAlerts)
      .innerJoin(schema.products, eq(schema.inventoryAlerts.productId, schema.products.id))
      .innerJoin(schema.stores, eq(schema.products.storeId, schema.stores.id))
      .where(and(eq(schema.inventoryAlerts.id, alertId), eq(schema.stores.userId, sellerId)))
      .limit(1);
    if (!alert) throw new NotFoundException('Alert not found');
    await this.db.delete(schema.inventoryAlerts).where(eq(schema.inventoryAlerts.id, alertId));
    return { data: { deleted: true } };
  }

  private async checkAndTriggerAlert(productId: string, variantId: string | undefined, newStock: number) {
    const alertWhere = variantId
      ? and(eq(schema.inventoryAlerts.productId, productId), eq(schema.inventoryAlerts.variantId, variantId))
      : and(eq(schema.inventoryAlerts.productId, productId), sql`${schema.inventoryAlerts.variantId} IS NULL`);
    const alerts = await this.db.select().from(schema.inventoryAlerts).where(alertWhere);
    for (const alert of alerts) {
      if (newStock <= alert.threshold) {
        await this.db
          .update(schema.inventoryAlerts)
          .set({ updatedAt: new Date() })
          .where(eq(schema.inventoryAlerts.id, alert.id));
      }
    }
  }
}
