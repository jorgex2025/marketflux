import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../../notifications/notifications.service';

export const NOTIFICATION_QUEUE = 'notification';

export type NotificationEvent =
  | 'order_paid'
  | 'order_shipped'
  | 'order_delivered'
  | 'review_received'
  | 'message_received'
  | 'dispute_opened'
  | 'return_requested'
  | 'payout_processed'
  | 'low_stock';

export interface NotificationJobData {
  userId: string;
  type: NotificationEvent;
  payload?: Record<string, unknown>;
  // Campos para notificaciones de eventos
  event?: NotificationEvent;
  title?: string;
  body?: string;
  meta?: Record<string, unknown>;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { userId, type, event, title, body, meta, payload } = job.data;
    const resolvedType = type ?? event;
    this.logger.log(`[${job.id}] Dispatching notification "${resolvedType}" to user ${userId}`);

    try {
await this.notificationsService.notify({
        userId,
        type: resolvedType as any,
        title: title ?? resolvedType ?? 'Notificación',
        body: body ?? JSON.stringify(payload ?? {}),
      });
      this.logger.log(`[${job.id}] Notification stored for user ${userId}`);
    } catch (err) {
      this.logger.error(`[${job.id}] Failed to create notification for user ${userId}`, err);
      throw err;
    }
  }
}
