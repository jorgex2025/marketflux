import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { banners } from '../database/schema';
import { DrizzleService } from '../database/database.module';

type BannerRow = {
  id: string;
  title: string;
  image: string;
  url: string | null;
  position: string;
  active: boolean | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BannersService {
  constructor(
    private readonly drizzleService: DrizzleService,
  ) {}

  private get db() {
    return this.drizzleService.db;
  }

  async findAll(): Promise<BannerRow[]> {
    return (this.db as any)
      .select().from(banners)
      .orderBy(desc(banners.createdAt));
  }

  async findById(id: string): Promise<BannerRow> {
    const [banner] = await (this.db as any)
      .select().from(banners).where(eq(banners.id, id)).limit(1);
    if (!banner) throw new NotFoundException(`Banner '${id}' no encontrado`);
    return banner;
  }

  async getActive(position?: string): Promise<BannerRow[]> {
    const now = new Date();
    const conditions = [
      eq(banners.active, true),
      lte(banners.startsAt, now),
      gte(banners.endsAt, now),
    ];
    if (position) conditions.push(eq(banners.position, position));

    return (this.db as any)
      .select().from(banners)
      .where(and(...conditions))
      .orderBy(desc(banners.createdAt));
  }

  async create(dto: {
    title: string;
    image: string;
    url?: string;
    position: string;
    startsAt: Date;
    endsAt: Date;
  }): Promise<BannerRow> {
    const [banner] = await (this.db as any)
      .insert(banners)
      .values({
        id: createId(),
        title: dto.title,
        image: dto.image,
        url: dto.url ?? null,
        position: dto.position,
        active: true,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
      })
      .returning();

    return banner;
  }

  async update(id: string, dto: {
    title?: string;
    image?: string;
    url?: string;
    position?: string;
    active?: boolean;
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<BannerRow> {
    await this.findById(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title !== undefined) updateData['title'] = dto.title;
    if (dto.image !== undefined) updateData['image'] = dto.image;
    if (dto.url !== undefined) updateData['url'] = dto.url;
    if (dto.position !== undefined) updateData['position'] = dto.position;
    if (dto.active !== undefined) updateData['active'] = dto.active;
    if (dto.startsAt !== undefined) updateData['startsAt'] = dto.startsAt;
    if (dto.endsAt !== undefined) updateData['endsAt'] = dto.endsAt;

    const [updated] = await (this.db as any)
      .update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<{ deleted: string }> {
    await this.findById(id);
    await (this.db as any).delete(banners).where(eq(banners.id, id));
    return { deleted: id };
  }
}
