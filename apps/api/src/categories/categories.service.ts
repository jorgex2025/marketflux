import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { categories } from '../database/schema';
import { DrizzleService } from '../database/database.module';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string | null;
  description: string | null;
  position: number | null;
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryRow[];
};

@Injectable()
export class CategoriesService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  // ── GET /api/categories (público — árbol anidado) ──
  async findTree(): Promise<CategoryRow[]> {
    const rows: CategoryRow[] = await (this.db as any)
      .select()
      .from(categories)
      .orderBy(categories.order, categories.name);

    return this.buildTree(rows);
  }

  // ── GET /api/categories/:slug (público) ──
  async findBySlug(slug: string): Promise<CategoryRow> {
    const [cat] = await (this.db as any)
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!cat) throw new NotFoundException(`Categoría '${slug}' no encontrada`);
    return cat;
  }

  // ── POST /api/categories (admin) ──
  async create(dto: CreateCategoryDto): Promise<CategoryRow> {
    const slug = this.generateSlug(dto.name);

    const [existing] = await (this.db as any)
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) throw new ConflictException(`Slug '${slug}' ya existe`);

    const [cat] = await (this.db as any)
      .insert(categories)
      .values({
        id:          createId(),
        name:        dto.name,
        slug,
        description: dto.description ?? null,
        parentId:    dto.parentId    ?? null,
        image:       dto.image       ?? null,
        position:    dto.position    ?? 0,
      })
      .returning();

    return cat;
  }

  // ── PATCH /api/categories/:id (admin) ──
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryRow> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name        !== undefined) {
      updateData['name'] = dto.name;
      updateData['slug'] = this.generateSlug(dto.name);
    }
    if (dto.description !== undefined) updateData['description'] = dto.description;
    if (dto.parentId    !== undefined) updateData['parentId']    = dto.parentId;
    if (dto.image       !== undefined) updateData['image']       = dto.image;
    if (dto.position    !== undefined) updateData['position']    = dto.position;

    const [updated] = await (this.db as any)
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`Categoría '${id}' no encontrada`);
    return updated;
  }

  // ── DELETE /api/categories/:id (admin) ──
  async remove(id: string): Promise<{ deleted: string }> {
    const [deleted] = await (this.db as any)
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });

    if (!deleted) throw new NotFoundException(`Categoría '${id}' no encontrada`);
    return { deleted: id };
  }

  // ── HELPERS ──
  private buildTree(rows: CategoryRow[]): CategoryRow[] {
    const map = new Map<string, CategoryRow & { children: CategoryRow[] }>();
    const roots: (CategoryRow & { children: CategoryRow[] })[] = [];

    for (const row of rows) {
      map.set(row.id, { ...row, children: [] });
    }
    for (const row of rows) {
      const node = map.get(row.id)!;
      if (row.parentId && map.has(row.parentId)) {
        map.get(row.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
