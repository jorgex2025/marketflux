import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /api/notifications — todas mis notificaciones (últimas 50)
  @Get()
  getAll(@Request() req: { user: { id: string } }) {
    return this.notificationsService.getAll(req.user.id);
  }

  // GET /api/notifications/unread — solo no leídas
  @Get('unread')
  getUnread(@Request() req: { user: { id: string } }) {
    return this.notificationsService.getUnread(req.user.id);
  }

  // PATCH /api/notifications/:id/read — marcar una como leída
  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  // PATCH /api/notifications/read-all — marcar todas como leídas
  @Patch('read-all')
  markAllRead(@Request() req: { user: { id: string } }) {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
