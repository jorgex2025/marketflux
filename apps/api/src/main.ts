import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true es requerido por Stripe para verificar la firma del webhook
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // WebSocket adapter — requerido para @WebSocketGateway (socket.io)
  app.useWebSocketAdapter(new IoAdapter(app));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env['PORT'] ?? 3001);
  console.log(`API running on :${process.env['PORT'] ?? 3001}`);
}

void bootstrap();
