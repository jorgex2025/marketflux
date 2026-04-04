import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export const NOTIFICATION_TYPES = [
  'order_paid',
  'order_shipped',
  'order_delivered',
  'review_received',
  'message_received',
  'dispute_opened',
  'return_requested',
  'payout_processed',
  'low_stock',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export class NotifyDto {
  @IsString()
  @IsNotEmpty()
  userId: string = '';

  @IsEnum(NOTIFICATION_TYPES)
  type: NotificationType = NOTIFICATION_TYPES[0];

  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsOptional()
  body?: string;

  @IsOptional()
  data?: Record<string, unknown> = {};
}
