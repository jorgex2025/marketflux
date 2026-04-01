import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import MeiliSearch from 'meilisearch';

export interface ProductDocument {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  categoryId: string | null;
  storeId: string;
  sellerId: string;
  status: string;
  featured: boolean;
  stock: number;
  tags: string[];
  images: string[];
  createdAt: string;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly client: MeiliSearch;
  private readonly index = 'products';
  private readonly logger = new Logger(SearchService.name);

  constructor() {
    this.client = new MeiliSearch({
      host: process.env['MEILISEARCH_HOST'] ?? 'http://localhost:7700',
      apiKey: process.env['MEILISEARCH_API_KEY'] ?? 'masterKey',
    });
  }

  async onModuleInit() {
    try {
      const idx = this.client.index(this.index);
      await idx.updateSettings({
        searchableAttributes: ['name', 'description', 'tags'],
        filterableAttributes: ['categoryId', 'storeId', 'status', 'featured', 'price'],
        sortableAttributes: ['price', 'createdAt'],
      });
    } catch (err) {
      this.logger.warn(`Meilisearch init warning: ${String(err)}`);
    }
  }

  async upsert(doc: ProductDocument): Promise<void> {
    try {
      await this.client.index(this.index).addDocuments([doc]);
    } catch (err) {
      this.logger.error(`Meilisearch upsert failed: ${String(err)}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.index(this.index).deleteDocument(id);
    } catch (err) {
      this.logger.error(`Meilisearch delete failed: ${String(err)}`);
    }
  }

  async search(
    query: string,
    filters: {
      categoryId?: string;
      storeId?: string;
      minPrice?: number;
      maxPrice?: number;
      featured?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { page = 1, limit = 20 } = filters;
    const filterParts: string[] = [];
    if (filters.categoryId) filterParts.push(`categoryId = "${filters.categoryId}"`);
    if (filters.storeId) filterParts.push(`storeId = "${filters.storeId}"`);
    if (filters.featured !== undefined) filterParts.push(`featured = ${filters.featured}`);
    if (filters.minPrice !== undefined) filterParts.push(`price >= ${filters.minPrice}`);
    if (filters.maxPrice !== undefined) filterParts.push(`price <= ${filters.maxPrice}`);

    const result = await this.client.index(this.index).search(query, {
      filter: filterParts.length ? filterParts.join(' AND ') : undefined,
      offset: (page - 1) * limit,
      limit,
    });

    return {
      data: result.hits as ProductDocument[],
      meta: {
        page,
        limit,
        total: result.estimatedTotalHits ?? 0,
        totalPages: Math.ceil((result.estimatedTotalHits ?? 0) / limit),
      },
    };
  }
}
