import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { SearchProductsDto } from './dto/search-products.dto';

export interface ProductDocument {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  vendorId: string;
  vendorName: string;
  stock: number;
  imageUrl: string | null;
  status: string;
  createdAt: string;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client!: MeiliSearch;
  private index!: Index<ProductDocument>;
  private readonly INDEX_NAME = 'products';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.client = new MeiliSearch({
      host: this.config.get<string>('MEILISEARCH_HOST', 'http://localhost:7700'),
      apiKey: this.config.get<string>('MEILISEARCH_API_KEY', 'masterKey'),
    });
    this.index = this.client.index<ProductDocument>(this.INDEX_NAME);
    await this.ensureIndex();
  }

  private async ensureIndex() {
    try {
      await this.client.getIndex(this.INDEX_NAME);
    } catch {
      await this.client.createIndex(this.INDEX_NAME, { primaryKey: 'id' });
      this.logger.log(`Índice '${this.INDEX_NAME}' creado en Meilisearch`);
    }
    await this.index.updateSettings({
      searchableAttributes: ['name', 'description', 'categoryName', 'vendorName'],
      filterableAttributes: ['categoryId', 'vendorId', 'status', 'price'],
      sortableAttributes: ['price', 'createdAt'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });
  }

  async indexProduct(product: ProductDocument): Promise<void> {
    await this.index.addDocuments([product]);
  }

  async indexProducts(products: ProductDocument[]): Promise<void> {
    if (!products.length) return;
    await this.index.addDocuments(products);
    this.logger.log(`Indexados ${products.length} productos`);
  }

  async updateProduct(product: Partial<ProductDocument> & { id: string }): Promise<void> {
    await this.index.updateDocuments([product]);
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.index.deleteDocument(productId);
  }

  async search(dto: SearchProductsDto) {
    const { q, categoryId, vendorId, minPrice, maxPrice, sortBy, sortOrder, page = 1, limit = 20 } = dto;

    const filters: string[] = ['status = "active"'];
    if (categoryId) filters.push(`categoryId = "${categoryId}"`);
    if (vendorId) filters.push(`vendorId = "${vendorId}"`);
    if (minPrice !== undefined) filters.push(`price >= ${minPrice}`);
    if (maxPrice !== undefined) filters.push(`price <= ${maxPrice}`);

    const sort: string[] = [];
    if (sortBy) sort.push(`${sortBy}:${sortOrder ?? 'asc'}`);

    const result = await this.index.search(q ?? '', {
      filter: filters.join(' AND '),
      sort: sort.length ? sort : undefined,
      offset: (page - 1) * limit,
      limit,
      attributesToHighlight: ['name', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });

    return {
      hits: result.hits,
      total: result.estimatedTotalHits ?? 0,
      page,
      limit,
      totalPages: Math.ceil((result.estimatedTotalHits ?? 0) / limit),
    };
  }

  async reindexAll(products: ProductDocument[]): Promise<void> {
    await this.index.deleteAllDocuments();
    await this.indexProducts(products);
    this.logger.log('Reindexado completo finalizado');
  }
}
