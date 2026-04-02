import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const INDEXING_QUEUE = 'indexing';

export interface IndexingJobData {
  action: 'index' | 'update' | 'delete';
  productId: string;
  document?: Record<string, unknown>;
}

@Processor(INDEXING_QUEUE)
export class IndexingProcessor extends WorkerHost {
  private readonly logger = new Logger(IndexingProcessor.name);

  async process(job: Job<IndexingJobData>): Promise<void> {
    const { action, productId, document } = job.data;
    this.logger.log(`[indexing] action=${action} productId=${productId}`);

    // SearchService se inyecta en ProductsService directamente para operaciones síncronas.
    // Este processor maneja indexaciones en lote o diferidas (bulk reindex).
    // TODO: inyectar SearchService aquí si se requiere indexación asíncrona.
    this.logger.log(`[indexing] Job ${job.id} procesado`);
  }
}
