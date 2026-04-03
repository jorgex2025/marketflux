import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/database.module';
import { notifications } from '../database/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { NotifyDto } from './dto/create-notification.dto';

type GatewayRef = { emitToUser: (userId: string, event: string, data: unknown) => void };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private gateway: GatewayRef | null = null;

  constructor(private readonly drizzle: DrizzleService) {}

  setGateway(gw: GatewayRef) {
    this.gateway = gw;
  }

  private emit(userId: string, event: string, data: unknown) {
    if (!this.gateway) {
      this.logger.warn(`Gateway not set — skipping real-time emit for user ${userId}`);
      return;
    }
    try {
      this.gateway.emitToUser(userId, event, data);
    } catch (err) {
      this.logger.error('Gateway emit failed', err);
    }
  }

  async notify(dto: NotifyDto) {
    const db = this.drizzle.db;
    const [notif] = await db
      .insert(notifications)
      .values({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        data: dto.data ?? null,
      })
      .returning();

    this.emit(dto.userId, 'notification', notif);
    return notif;
  }

  async getUnread(userId: string) {
    const db = this.drizzle.db;
    return db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .orderBy(desc(notifications.createdAt));
  }

  async getAll(userId: string, page = 1, limit = 20) {
    const db = this.drizzle.db;
    const offset = (page - 1) * limit;
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markRead(notificationId: string, userId: string) {
    const db = this.drizzle.db;
    const [existing] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .limit(1);

    if (!existing) throw new NotFoundException('Notificación no encontrada');

    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updated;
  }

  async markAllRead(userId: string) {
    const db = this.drizzle.db;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { success: true };
  }
}
