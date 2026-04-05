import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, or, ilike, desc, count } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { stores, products } from '../database/schema';
import { DrizzleService } from '../database/database.module';
import type { UpdateStoreDto } from './dto/update-store.dto';

type StoreRow = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  status: 'active' | 'pending' | 'suspended' | 'banned';
  stripeAccountId: string | null;
  onboardingCompleted: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoreWithProducts = StoreRow & {
  products?: {
    id: string;
    name: string;
    slug: string;
    price: string;
    status: string;
    images: string[] | null;
  }[];
};

@Injectable()
export class VendorsService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  // ── GET /api/stores (público — listado de tiendas activas) ──
  async findAll(query?: { q?: string; page?: number; limit?: number }): Promise<{
    data: StoreRow[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { q, page = 1, limit = 24 } = query ?? {};
    const offset = (page - 1) * limit;

    const filters = [eq(stores.status, 'active')];
    if (q) filters.push(or(ilike(stores.name, `%${q}%`), ilike(stores.description, `%${q}%`))!);

    const [totalResult] = await (this.db as any)
      .select({ value: count() })
      .from(stores)
      .where(and(...filters));

    const total = totalResult?.value ?? 0;

    const rows: StoreRow[] = await (this.db as any)
      .select()
      .from(stores)
      .where(and(...filters))
      .orderBy(desc(stores.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total, page, limit };
  }

  // ── GET /api/stores/:slug (público — detalle de tienda) ──
  async findBySlug(slug: string): Promise<StoreWithProducts> {
    const [store] = await (this.db as any)
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) throw new NotFoundException(`Tienda '${slug}' no encontrada`);

    const storeProducts = await (this.db as any)
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        status: products.status,
        images: products.images,
      })
      .from(products)
      .where(and(eq(products.storeId, store.id), eq(products.status, 'active')))
      .orderBy(desc(products.createdAt))
      .limit(12);

    return { ...store, products: storeProducts };
  }

  // ── GET /api/stores/id/:id (uso interno) ──
  async findById(id: string): Promise<StoreRow> {
    const [store] = await (this.db as any)
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);

    if (!store) throw new NotFoundException(`Tienda '${id}' no encontrada`);
    return store;
  }

  // ── GET /api/stores/user/:userId (tienda de un usuario) ──
  async findByUserId(userId: string): Promise<StoreRow | null> {
    const [store] = await (this.db as any)
      .select()
      .from(stores)
      .where(eq(stores.userId, userId))
      .limit(1);

    return store ?? null;
  }

  // ── POST /api/stores (crear tienda para un usuario) ──
  async create(dto: {
    userId: string;
    name: string;
    description?: string;
    logo?: string;
    banner?: string;
  }): Promise<StoreRow> {
    // Verificar que el usuario no tenga ya una tienda
    const [existing] = await (this.db as any)
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.userId, dto.userId))
      .limit(1);

    if (existing) {
      throw new ConflictException('El usuario ya tiene una tienda registrada');
    }

    const slug = this.generateSlug(dto.name);

    // Verificar slug único
    const [slugExists] = await (this.db as any)
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (slugExists) {
      throw new ConflictException(`Slug '${slug}' ya existe`);
    }

    const [store] = await (this.db as any)
      .insert(stores)
      .values({
        id: createId(),
        userId: dto.userId,
        name: dto.name,
        slug,
        description: dto.description ?? null,
        logo: dto.logo ?? null,
        banner: dto.banner ?? null,
        status: 'pending',
        onboardingCompleted: false,
      })
      .returning();

    return store;
  }

  // ── PATCH /api/stores/:id (actualizar tienda) ──
  async update(id: string, dto: UpdateStoreDto, requesterId: string, role: string): Promise<StoreRow> {
    const store = await this.findById(id);

    // Verificar ownership: solo el dueño o admin puede actualizar
    if (role !== 'admin' && store.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para modificar esta tienda');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) {
      updateData['name'] = dto.name;
      updateData['slug'] = this.generateSlug(dto.name);
    }
    if (dto.description !== undefined) updateData['description'] = dto.description;
    if (dto.logoUrl !== undefined) updateData['logo'] = dto.logoUrl;
    if (dto.bannerUrl !== undefined) updateData['banner'] = dto.bannerUrl;

    const [updated] = await (this.db as any)
      .update(stores)
      .set(updateData)
      .where(eq(stores.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`Tienda '${id}' no encontrada`);
    return updated;
  }

  // ── PATCH /api/stores/:id/status (admin — cambiar estado) ──
  async updateStatus(
    id: string,
    status: 'active' | 'pending' | 'suspended' | 'banned',
  ): Promise<StoreRow> {
    await this.findById(id);

    const [updated] = await (this.db as any)
      .update(stores)
      .set({ status, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();

    return updated;
  }

  // ── PATCH /api/stores/:id/onboarding (completar onboarding) ──
  async completeOnboarding(id: string, requesterId: string): Promise<StoreRow> {
    const store = await this.findById(id);

    if (store.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para esta tienda');
    }

    const [updated] = await (this.db as any)
      .update(stores)
      .set({ onboardingCompleted: true, status: 'active', updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();

    return updated;
  }

  // ── DELETE /api/stores/:id (admin — eliminar tienda) ──
  async remove(id: string): Promise<{ deleted: string }> {
    await this.findById(id);

    const [deleted] = await (this.db as any)
      .delete(stores)
      .where(eq(stores.id, id))
      .returning({ id: stores.id });

    if (!deleted) throw new NotFoundException(`Tienda '${id}' no encontrada`);
    return { deleted: id };
  }

  // ── HELPERS ──
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
}
