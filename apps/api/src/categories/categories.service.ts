import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema/index';
import {
  categories,
  categoryAttributes,
} from '../database/schema/catalog.schema';
import { eq, isNull } from 'drizzle-orm';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { CreateAttributeDto } from './dto/create-attribute.dto';

type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: DB) {}

  async findTree() {
    const all = await this.db.select().from(categories);
    const map = new Map(
      all.map((c) => ({ ...c, children: [] as typeof all })).map((c) => [c.id, c]),
    );
    const roots: (typeof map extends Map<unknown, infer V> ? V : never)[] = [];
    for (const node of map.values()) {
      if (node.parentId === null) {
        roots.push(node);
      } else {
        const parent = map.get(node.parentId);
        if (parent) (parent.children as typeof all).push(node as unknown as typeof all[0]);
      }
    }
    return roots;
  }

  async findAttributes(id: string) {
    const cat = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!cat.length) throw new NotFoundException('Category not found');
    return this.db
      .select()
      .from(categoryAttributes)
      .where(eq(categoryAttributes.categoryId, id));
  }

  async create(dto: CreateCategoryDto) {
    const [cat] = await this.db.insert(categories).values(dto).returning();
    return cat;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const [cat] = await this.db
      .update(categories)
      .set(dto)
      .where(eq(categories.id, id))
      .returning();
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async remove(id: string) {
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  async createAttribute(categoryId: string, dto: CreateAttributeDto) {
    const [attr] = await this.db
      .insert(categoryAttributes)
      .values({ ...dto, categoryId })
      .returning();
    return attr;
  }

  async updateAttribute(
    categoryId: string,
    attrId: string,
    dto: Partial<CreateAttributeDto>,
  ) {
    const [attr] = await this.db
      .update(categoryAttributes)
      .set(dto)
      .where(eq(categoryAttributes.id, attrId))
      .returning();
    if (!attr) throw new NotFoundException('Attribute not found');
    return attr;
  }

  async removeAttribute(categoryId: string, attrId: string) {
    await this.db
      .delete(categoryAttributes)
      .where(eq(categoryAttributes.id, attrId));
  }

  // usado internamente por ProductsService
  async findById(id: string) {
    const [cat] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return cat ?? null;
  }
}
