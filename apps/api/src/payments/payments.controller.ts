import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/payments/checkout-session
   * Crea una Stripe Checkout Session para una orden pendiente.
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.paymentsService.createCheckoutSession(dto, userId);
    return { data: result };
  }

  /**
   * POST /api/payments/webhook
   * Recibe eventos de Stripe (raw body requerido).
   * Debe estar excluido de autenticación y del body parser JSON global.
   */
  @Post('webhook')
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    await this.paymentsService.handleWebhook(req);
    return { received: true };
  }
}
