import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const EMAIL_QUEUE = 'email';

export interface EmailJobData {
  to: string;
  subject: string;
  template: 'order_confirmed' | 'order_shipped' | 'payout_processed' | 'welcome' | 'password_reset';
  context: Record<string, unknown>;
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context } = job.data;
    this.logger.log(`[email] Enviando template "${template}" a ${to} | subject: ${subject}`);

    // TODO: integrar Nodemailer/Resend/SendGrid en Fase 12
    // Ejemplo con Resend:
    // await this.resend.emails.send({ from: 'no-reply@marketflux.app', to, subject, html: renderTemplate(template, context) });

    this.logger.log(`[email] Job ${job.id} completado — template: ${template}`);
  }
}
