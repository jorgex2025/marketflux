import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export const EMAIL_QUEUE = 'email';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: 'welcome' | 'order-confirm' | 'payout-sent' | 'dispute-opened' | 'generic';
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.resend.com'),
      port: this.config.get<number>('SMTP_PORT', 465),
      secure: true,
      auth: {
        user: this.config.get<string>('SMTP_USER', 'resend'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, html, text } = job.data;
    this.logger.log(`[${job.id}] Sending email to ${to} — subject: "${subject}"`);

    try {
      const info = await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM', 'noreply@marketflux.app'),
        to,
        subject,
        html,
        text: text ?? html.replace(/<[^>]*>/g, ''),
      });
      this.logger.log(`[${job.id}] Email sent: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`[${job.id}] Failed to send email to ${to}`, err);
      throw err; // BullMQ reintentará según config
    }
  }
}
