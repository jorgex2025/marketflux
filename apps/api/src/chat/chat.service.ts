import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../database/database.module';
import { conversations, messages } from '../database/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import type { CreateConversationDto, SendMessageDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly drizzle: DrizzleService) {}

  // ─── Conversations ───────────────────────────────────────────────────────

  async createConversation(buyerId: string, dto: CreateConversationDto) {
    const db = this.drizzle.db;

    // Evitar duplicados: misma pareja buyer+seller+product
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.buyerId, buyerId),
          eq(conversations.sellerId, dto.sellerId),
          dto.productId
            ? eq(conversations.productId, dto.productId)
            : eq(conversations.productId, null as unknown as string),
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(conversations)
      .values({
        buyerId,
        sellerId: dto.sellerId,
        productId: dto.productId ?? null,
      })
      .returning();

    return created;
  }

  async getConversations(userId: string) {
    const db = this.drizzle.db;
    return db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.buyerId, userId),
          eq(conversations.sellerId, userId),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationById(conversationId: string, userId: string) {
    const db = this.drizzle.db;
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) throw new NotFoundException('Conversación no encontrada');
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException('Sin acceso a esta conversación');
    }
    return conv;
  }

  // ─── Messages ────────────────────────────────────────────────────────────

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const db = this.drizzle.db;

    // Verificar que el sender pertenece a la conversación
    await this.getConversationById(dto.conversationId, senderId);

    const [msg] = await db
      .insert(messages)
      .values({
        conversationId: dto.conversationId,
        senderId,
        body: dto.body,
        attachments: dto.attachments ?? [],
      })
      .returning();

    // Actualizar lastMessageAt en la conversación
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, dto.conversationId));

    return msg;
  }

  async getMessages(conversationId: string, userId: string) {
    const db = this.drizzle.db;
    await this.getConversationById(conversationId, userId);

    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageRead(messageId: string, userId: string) {
    const db = this.drizzle.db;
    const [msg] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!msg) throw new NotFoundException('Mensaje no encontrado');

    // Solo el receptor puede marcar como leído
    await this.getConversationById(msg.conversationId, userId);

    const [updated] = await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  }
}
