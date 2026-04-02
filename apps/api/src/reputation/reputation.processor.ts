import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ReputationService } from './reputation.service';
import { DrizzleService } from '../database/drizzle.service';
import { products, orderItems, orders } from '../database/schema';
import { eq, and } from 'drizzle-orm';

@Processor('reputation')
export class ReputationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReputationProcessor.name);

  constructor(
    private readonly reputationService: ReputationService,
    private readonly db: DrizzleService,
  ) {
    super();
  }

  async process(job: Job<{ productId: string; sellerId?: string }>): Promise<void> {
    const { productId, sellerId: rawSellerId } = job.data;

    let sellerId = rawSellerId;

    if (!sellerId) {
      // Resolver sellerId desde el producto
      const dbInstance = this.db.db;
      const [product] = await dbInstance
        .select({ storeId: products.storeId })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        this.logger.warn(`Producto ${productId} no encontrado para recálculo de reputación`);
        return;
      }

      // Obtener userId del seller desde la store
      const { stores } = await import('../database/schema');
      const [store] = await dbInstance
        .select({ userId: stores.userId })
        .from(stores)
        .where(eq(stores.id, product.storeId))
        .limit(1);

      if (!store) {
        this.logger.warn(`Store ${product.storeId} no encontrada`);
        return;
      }

      sellerId = store.userId;
    }

    this.logger.log(`Recalculando reputación para seller ${sellerId}`);
    await this.reputationService.recalculate(sellerId);
    this.logger.log(`Reputación recalculada para seller ${sellerId}`);
  }
}
