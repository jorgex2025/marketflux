import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../../notifications/notifications.service';

export const NOTIFICATION_QUEUE = 'notification';

export type NotificationEvent =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payout_sent'
  | 'dispute_opened'
  | 'review_received'
  | 'chat_message';

export interface NotificationJobData {
  userId: string;
  event: NotificationEvent;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { userId, event, title, body, meta } = job.data;
    this.logger.log(`[${job.id}] Dispatching notification "${event}" to user ${userId}`);

    try {
      await this.notificationsService.create({
        userId,
        type: event,
        title,
        body,
        meta: meta ?? {},
        read: false,
      });
      this.logger.log(`[${job.id}] Notification stored for user ${userId}`);
    } catch (err) {
      this.logger.error(`[${job.id}] Failed to create notification for user ${userId}`, err);
      throw err;
    }
  }
}
