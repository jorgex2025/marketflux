import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CreateConversationDto } from './dto/create-chat.dto';

@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // POST /api/chat/conversations — crear o reutilizar conversación
  @Post('conversations')
  createConversation(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(req.user.id, dto);
  }

  // GET /api/chat/conversations — listar mis conversaciones
  @Get('conversations')
  getConversations(@Request() req: { user: { id: string } }) {
    return this.chatService.getConversations(req.user.id);
  }

  // GET /api/chat/conversations/:id/messages — mensajes de una conversación
  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') conversationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.chatService.getMessages(conversationId, req.user.id);
  }
}
