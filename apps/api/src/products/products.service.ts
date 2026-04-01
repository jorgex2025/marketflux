import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema/index';
import { products, productVariants, stores } from '../database/schema/index';
import { eq, and, gte, lte, ilike, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { SearchService } from '../search/search.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { CreateVariantDto } from './dto/create-variant.dto';
import type { ProductQueryDto } from './dto/product-query.dto';

type DB = NodePgDatabase<typeof schema>;

// In-memory job store (prod: usar Redis/BullMQ)
const bulkJobs = new Map<string, { status: string; progress: number; total: number }>();

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DB,
    private readonly search: SearchService,
  ) {}

  async findAll(query: ProductQueryDto) {
    const { q, category, store, minPrice, maxPrice, featured, page = 1, limit = 20 } = query;

    // Delegar a Meilisearch si hay query de texto
    if (q) {
      return this.search.search(q, {
        categoryId: category,
        storeId: store,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        featured,
        page,
        limit,
      });
    }

    // Query directa a DB
    let rows = await this.db.select().from(products).where(eq(products.status, 'active'));

    if (category) rows = rows.filter((p) => p.categoryId === category);
    if (store) rows = rows.filter((p) => p.storeId === store);
    if (featured !== undefined) rows = rows.filter((p) => p.featured === featured);
    if (minPrice) rows = rows.filter((p) => Number(p.price) >= Number(minPrice));
    if (maxPrice) rows = rows.filter((p) => Number(p.price) <= Number(maxPrice));

    const total = rows.length;
    const sliced = rows.slice((page - 1) * limit, page * limit);
    return {
      data: sliced,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');
    const variants = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));
    return { ...product, variants };
  }

  async create(dto: CreateProductDto, userId: string, userRole: string) {
    // Buscar la store del seller
    const [store] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, userId))
      .limit(1);
    if (!store && userRole !== 'admin') {
      throw new ForbiddenException('You must have an active store to create products');
    }
    const storeId = dto.storeId ?? store?.id;
    if (!storeId) throw new BadRequestException('storeId required for admin');

    const slug = dto.slug ?? this.slugify(dto.name);
    const id = randomUUID();

    const [product] = await this.db
      .insert(products)
      .values({ id, ...dto, slug, storeId, sellerId: userId })
      .returning();

    await this.syncToSearch(product);
    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string, userRole: string) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');
    if (userRole !== 'admin' && existing.sellerId !== userId) {
      throw new ForbiddenException('Not your product');
    }

    const [updated] = await this.db
      .update(products)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    await this.syncToSearch(updated);
    return updated;
  }

  async remove(id: string) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');
    await this.db.delete(products).where(eq(products.id, id));
    await this.search.delete(id);
  }

  // ---- Variantes ----

  async findVariants(productId: string) {
    return this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    const [variant] = await this.db
      .insert(productVariants)
      .values({ id: randomUUID(), productId, ...dto })
      .returning();
    return variant;
  }

  async updateVariant(productId: string, variantId: string, dto: Partial<CreateVariantDto>) {
    const [variant] = await this.db
      .update(productVariants)
      .set({ ...dto, updatedAt: new Date() })
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.productId, productId),
        ),
      )
      .returning();
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  async removeVariant(productId: string, variantId: string) {
    await this.db
      .delete(productVariants)
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.productId, productId),
        ),
      );
  }

  // ---- Bulk ----

  startBulkJob(items: unknown[]): string {
    const jobId = randomUUID();
    bulkJobs.set(jobId, { status: 'processing', progress: 0, total: items.length });
    // Procesamiento async simulado — en producción: BullMQ
    void this.processBulk(jobId, items);
    return jobId;
  }

  getBulkStatus(jobId: string) {
    const job = bulkJobs.get(jobId);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private async processBulk(jobId: string, items: unknown[]) {
    const job = bulkJobs.get(jobId);
    if (!job) return;
    for (let i = 0; i < items.length; i++) {
      job.progress = i + 1;
      await new Promise((r) => setTimeout(r, 50));
    }
    job.status = 'done';
  }

  // ---- CSV Export ----

  async exportCsv(userId: string, userRole: string): Promise<string> {
    let rows = await this.db.select().from(products);
    if (userRole !== 'admin') {
      rows = rows.filter((p) => p.sellerId === userId);
    }
    const header = 'id,name,slug,price,stock,status,storeId,createdAt';
    const lines = rows.map(
      (p) =>
        `${p.id},"${p.name}",${p.slug},${p.price},${p.stock},${p.status},${p.storeId},${p.createdAt.toISOString()}`,
    );
    return [header, ...lines].join('\n');
  }

  // ---- CSV Import ----

  async importCsv(csvContent: string, userId: string): Promise<{ imported: number }> {
    const lines = csvContent.split('\n').filter(Boolean);
    const [header, ...rows] = lines;
    if (!header) throw new BadRequestException('Empty CSV');
    let imported = 0;
    for (const row of rows) {
      const [name, price, stock, categoryId] = row.split(',');
      if (!name || !price) continue;
      const slug = this.slugify(name.replace(/"/g, ''));
      const [store] = await this.db
        .select()
        .from(stores)
        .where(eq(stores.ownerId, userId))
        .limit(1);
      if (!store) continue;
      await this.db.insert(products).values({
        id: randomUUID(),
        name: name.replace(/"/g, ''),
        slug: `${slug}-${randomUUID().slice(0, 6)}`,
        price,
        stock: Number(stock) || 0,
        storeId: store.id,
        sellerId: userId,
        categoryId: categoryId?.trim() || null,
      }).onConflictDoNothing();
      imported++;
    }
    return { imported };
  }

  // ---- Helpers ----

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async syncToSearch(product: typeof products.$inferSelect) {
    await this.search.upsert({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      price: product.price,
      categoryId: product.categoryId ?? null,
      storeId: product.storeId,
      sellerId: product.sellerId,
      status: product.status,
      featured: product.featured,
      stock: product.stock,
      tags: product.tags ?? [],
      images: product.images ?? [],
      createdAt: product.createdAt.toISOString(),
    });
  }
}
