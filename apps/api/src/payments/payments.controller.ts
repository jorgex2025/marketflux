import {
  Body,
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { Public } from '../common/decorators/public.decorator';

type AuthRequest = Request & { user: { id: string; role: string } };

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/payments/checkout-session
   * Requiere sesión activa (AuthGuard global).
   * Devuelve la URL de Stripe Checkout.
   */
  @Post('checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Req() req: AuthRequest,
  ) {
    return this.paymentsService.createCheckoutSession(dto, req.user.id);
  }

  /**
   * POST /api/payments/webhook
   * Excluido de AuthGuard con @Public().
   * rawBody requerido — configurado en main.ts con bodyParser raw para esta ruta.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    await this.paymentsService.handleWebhook(req);
    return { received: true };
  }
}
