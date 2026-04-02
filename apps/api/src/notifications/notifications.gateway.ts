import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { DrizzleService } from '../database/database.module';
import { sessions, users } from '../database/schema';
import { eq, and, gt } from 'drizzle-orm';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000', credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly drizzle: DrizzleService,
  ) {}

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
      .select({ userId: sessions.userId })
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

    client.data['userId'] = session.userId;
    await client.join(`user:${session.userId}`);

    // Registrar gateway en el service (pattern para evitar circular dep)
    this.notificationsService.setGateway(this);

    // Enviar no leídas al conectar
    const unread = await this.notificationsService.getUnread(session.userId);
    client.emit('unread_notifications', unread);

    console.log(`[Notifications] Connected: ${session.userId} (socket: ${client.id})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Notifications] Disconnected: ${client.data['userId']} (socket: ${client.id})`);
  }

  // ─── Helper público para emitir desde NotificationsService ───────────────
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
