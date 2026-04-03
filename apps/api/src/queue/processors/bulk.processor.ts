import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDrizzle } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

export const BULK_QUEUE = 'bulk';

export interface BulkJobData {
  action: 'create' | 'update' | 'delete';
  sellerId: string;
  products: Array<{
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string;
  }>;
}

@Processor(BULK_QUEUE)
export class BulkProcessor extends WorkerHost {
  private readonly logger = new Logger(BulkProcessor.name);

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<BulkJobData>): Promise<{ processed: number; errors: string[] }> {
    const { action, sellerId, products } = job.data;
    const errors: string[] = [];
    let processed = 0;

    this.logger.log(`Processing bulk ${action} for seller ${sellerId}: ${products.length} items`);

    for (const item of products) {
      try {
        if (action === 'create') {
          await this.db.insert(schema.products).values({
            name: item.name ?? '',
            description: item.description ?? '',
            price: String(item.price ?? 0),
            storeId: sellerId,
            categoryId: item.categoryId ?? '',
            status: 'active',
          });
        } else if (action === 'update' && item.id) {
          await this.db
            .update(schema.products)
            .set({
              ...(item.name && { name: item.name }),
              ...(item.description && { description: item.description }),
              ...(item.price !== undefined && { price: String(item.price) }),
            })
            .where(eq(schema.products.id, item.id));
        } else if (action === 'delete' && item.id) {
          await this.db
            .update(schema.products)
            .set({ status: 'deleted' })
            .where(eq(schema.products.id, item.id));
        }
        processed++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Item ${item.id ?? item.name}: ${msg}`);
        this.logger.error(`Bulk ${action} failed for item ${item.id ?? item.name}: ${msg}`);
      }
    }

    this.logger.log(`Bulk ${action} complete: ${processed} ok, ${errors.length} errors`);
    return { processed, errors };
  }
}
