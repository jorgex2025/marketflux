import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, gte, lte, ilike, desc, asc, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createId } from '@paralleldrive/cuid2';
import { products, stores } from '../database/schema';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { ProductQueryDto } from './dto/product-query.dto';

type SearchIndex = {
  upsert(id: string, doc: Record<string, unknown>): Promise<void>;
  delete(id: string): Promise<void>;
};

// In-memory bulk job tracker
const bulkJobs = new Map<string, { total: number; done: number; errors: string[] }>();

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: NodePgDatabase<Record<string, never>>,
    private readonly search: SearchIndex,
  ) {}

  // ──────────────────────────────── LIST (public) ──────────────────────────────
  async findAll(query: ProductQueryDto) {
    const { q, category, store, minPrice, maxPrice, featured, page = 1, limit = 24 } = query;
    const filters: SQL[] = [eq(products.status, 'active')];

    if (category) filters.push(eq(products.categoryId, category));
    if (store)    filters.push(eq(products.storeId, store));
    if (featured) filters.push(eq(products.featured, true));
    if (minPrice) filters.push(gte(products.price, minPrice));
    if (maxPrice) filters.push(lte(products.price, maxPrice));
    if (q)        filters.push(ilike(products.name, `%${q}%`));

    const offset = (page - 1) * limit;

    const rows = await (this.db as any)
      .select()
      .from(products)
      .where(and(...filters))
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, page, limit };
  }

  // ──────────────────────────── GET BY SLUG (public) ───────────────────────────
  async findBySlug(slug: string) {
    const [product] = await (this.db as any)
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) throw new NotFoundException(`Producto '${slug}' no encontrado`);
    return product;
  }

  // ──────────────────────────── GET BY ID ──────────────────────────────────
  async findById(id: string) {
    const [product] = await (this.db as any)
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) throw new NotFoundException(`Producto '${id}' no encontrado`);
    return product;
  }

  // ──────────────────────────── CREATE ────────────────────────────────────
  async create(dto: CreateProductDto, sellerId: string) {
    // Verificar que el seller tiene una store activa
    const [store] = await (this.db as any)
      .select({ id: stores.id })
      .from(stores)
      .where(and(eq(stores.userId, sellerId), eq(stores.status, 'active')))
      .limit(1);

    if (!store) {
      throw new ForbiddenException('Necesitas una tienda activa para crear productos');
    }

    const slug = this.generateSlug(dto.name);

    // Verificar slug único
    const [existing] = await (this.db as any)
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existing) {
      throw new ConflictException(`Slug '${slug}' ya existe`);
    }

    const [product] = await (this.db as any)
      .insert(products)
      .values({
        id:           createId(),
        storeId:      store.id,
        name:         dto.name,
        slug,
        description:  dto.description ?? null,
        price:        String(dto.price),
        comparePrice: dto.comparePrice ? String(dto.comparePrice) : null,
        stock:        dto.stock ?? 0,
        sku:          dto.sku ?? null,
        categoryId:   dto.categoryId ?? null,
        images:       dto.images ?? [],
        featured:     dto.featured ?? false,
        status:       dto.status ?? 'draft',
        attributes:   dto.attributes ?? null,
      })
      .returning();

    // Indexar en Meilisearch (no bloquea si falla)
    this.indexProduct(product).catch(() => null);

    return product;
  }

  // ──────────────────────────── UPDATE ────────────────────────────────────
  async update(
    id: string,
    dto: UpdateProductDto,
    requesterId: string,
    requesterRole: string,
  ) {
    const product = await this.findById(id);

    // Verificar ownership: solo el seller dueño o admin puede actualizar
    if (requesterRole !== 'admin') {
      const [store] = await (this.db as any)
        .select({ userId: stores.userId })
        .from(stores)
        .where(eq(stores.id, product.storeId))
        .limit(1);

      if (store?.userId !== requesterId) {
        throw new ForbiddenException('No tienes permisos para modificar este producto');
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined)         updateData['name']         = dto.name;
    if (dto.description !== undefined)  updateData['description']  = dto.description;
    if (dto.price !== undefined)        updateData['price']        = String(dto.price);
    if (dto.comparePrice !== undefined) updateData['comparePrice'] = dto.comparePrice ? String(dto.comparePrice) : null;
    if (dto.stock !== undefined)        updateData['stock']        = dto.stock;
    if (dto.sku !== undefined)          updateData['sku']          = dto.sku;
    if (dto.categoryId !== undefined)   updateData['categoryId']   = dto.categoryId;
    if (dto.images !== undefined)       updateData['images']       = dto.images;
    if (dto.featured !== undefined)     updateData['featured']     = dto.featured;
    if (dto.status !== undefined)       updateData['status']       = dto.status;
    if (dto.attributes !== undefined)   updateData['attributes']   = dto.attributes;

    const [updated] = await (this.db as any)
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    this.indexProduct(updated).catch(() => null);
    return updated;
  }

  // ──────────────────────────── REMOVE ────────────────────────────────────
  async remove(id: string) {
    await this.findById(id); // lanza 404 si no existe
    await (this.db as any).delete(products).where(eq(products.id, id));
    await this.search.delete(id);
    return { deleted: id };
  }

  // ──────────────────────────── BULK IMPORT ──────────────────────────────
  startBulkJob(rows: Record<string, unknown>[]): string {
    const jobId = createId();
    bulkJobs.set(jobId, { total: rows.length, done: 0, errors: [] });
    // Proceso async en background
    this.processBulk(jobId, rows);
    return jobId;
  }

  getBulkStatus(jobId: string) {
    const job = bulkJobs.get(jobId);
    if (!job) throw new NotFoundException(`Job '${jobId}' no encontrado`);
    return { jobId, ...job, completed: job.done >= job.total };
  }

  private async processBulk(
    jobId: string,
    rows: Record<string, unknown>[],
  ): Promise<void> {
    const job = bulkJobs.get(jobId)!;
    for (const row of rows) {
      try {
        await this.create(row as unknown as CreateProductDto, row['sellerId'] as string ?? '');
        job.done++;
      } catch (err: unknown) {
        job.errors.push(err instanceof Error ? err.message : String(err));
        job.done++;
      }
    }
  }

  // ──────────────────────────── HELPERS ────────────────────────────────────
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      + '-' + createId().slice(0, 6);
  }

  private async indexProduct(product: Record<string, unknown>): Promise<void> {
    await this.search.upsert(product['id'] as string, {
      id:          product['id'],
      name:        product['name'],
      description: product['description'],
      price:       product['price'],
      categoryId:  product['categoryId'],
      storeId:     product['storeId'],
      featured:    product['featured'],
      status:      product['status'],
    });
  }
}
