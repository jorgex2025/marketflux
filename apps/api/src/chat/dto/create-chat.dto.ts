import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @IsString()
  @IsOptional()
  productId?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  attachments?: string[];
}
