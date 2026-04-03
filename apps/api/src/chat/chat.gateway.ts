import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { DrizzleService } from '../database/database.module';
import { sessions, users } from '../database/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { SendMessageDto, CreateConversationDto } from './dto/create-chat.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly drizzle: DrizzleService,
  ) {}

  // ─── Auth en handshake ───────────────────────────────────────────────────
  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth['token'] as string | undefined) ??
      (client.handshake.headers['authorization'] as string | undefined)?.replace('Bearer ', '');

    if (!token) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
      return;
    }

    const db = this.drizzle.db;
    const [session] = await db
      .select({
        userId: sessions.userId,
        userRole: users.role,
        userName: users.name,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
      return;
    }

    // Adjuntar userId al socket para usarlo en los eventos
    client.data['userId'] = session.userId;
    client.data['userName'] = session.userName;

    // Unir al room personal del usuario
    await client.join(`user:${session.userId}`);
    console.log(`[Chat] Connected: ${session.userId} (socket: ${client.id})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat] Disconnected: ${client.data['userId']} (socket: ${client.id})`);
  }

  // ─── Eventos de cliente → servidor ──────────────────────────────────────

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data['userId'] as string;
    // Valida acceso antes de unir al room
    await this.chatService.getConversationById(payload.conversationId, userId);
    await client.join(`conv:${payload.conversationId}`);
    return { event: 'joined', conversationId: payload.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    await client.leave(`conv:${payload.conversationId}`);
    return { event: 'left', conversationId: payload.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Omit<SendMessageDto, 'conversationId'> & { conversationId: string },
  ) {
    const userId = client.data['userId'] as string;
    const msg = await this.chatService.sendMessage(userId, payload);

    // Broadcast al room de la conversación (incluye sender)
    this.server.to(`conv:${payload.conversationId}`).emit('new_message', msg);
    return msg;
  }

  @SubscribeMessage('create_conversation')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateConversationDto,
  ) {
    const userId = client.data['userId'] as string;
    const conv = await this.chatService.createConversation(userId, payload);
    return conv;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ) {
    const userId = client.data['userId'] as string;
    const updated = await this.chatService.markMessageRead(payload.messageId, userId);
    return updated;
  }

  // ─── Helper para emitir desde otros servicios ────────────────────────────
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
