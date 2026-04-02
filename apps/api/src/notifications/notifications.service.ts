import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../database/database.module';
import { notifications } from '../database/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { NotifyDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  // Referencia al gateway inyectada en runtime para evitar dependencia circular
  private gateway: { emitToUser: (userId: string, event: string, data: unknown) => void } | null = null;

  constructor(private readonly drizzle: DrizzleService) {}

  setGateway(gw: { emitToUser: (userId: string, event: string, data: unknown) => void }) {
    this.gateway = gw;
  }

  // ─── Crear y emitir notificación ─────────────────────────────────────────
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

    // Emitir en tiempo real si el usuario está conectado
    this.gateway?.emitToUser(dto.userId, 'notification', notif);

    return notif;
  }

  // ─── Obtener notificaciones no leídas ────────────────────────────────────
  async getUnread(userId: string) {
    const db = this.drizzle.db;
    return db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      )
      .orderBy(desc(notifications.createdAt));
  }

  // ─── Obtener todas (con paginación futura) ────────────────────────────────
  async getAll(userId: string) {
    const db = this.drizzle.db;
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  // ─── Marcar una como leída ────────────────────────────────────────────────
  async markRead(notificationId: string, userId: string) {
    const db = this.drizzle.db;
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) throw new NotFoundException('Notificación no encontrada');

    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();

    return updated;
  }

  // ─── Marcar todas como leídas ─────────────────────────────────────────────
  async markAllRead(userId: string) {
    const db = this.drizzle.db;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      );
    return { success: true };
  }
}
