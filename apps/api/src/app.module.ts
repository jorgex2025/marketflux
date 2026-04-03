import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { DatabaseModule } from './database/database.module';
import { VendorsModule } from './vendors/vendors.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReputationModule } from './reputation/reputation.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CommissionsModule } from './commissions/commissions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ShippingModule } from './shipping/shipping.module';
import { ReturnsModule } from './returns/returns.module';
import { DisputesModule } from './disputes/disputes.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueModule } from './queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SearchModule } from './search/search.module';
import { BannersModule } from './banners/banners.module';
import { MarketplaceConfigModule } from './config/config.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 100 req/min global, payments override a 10/min en su controller
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    StorageModule,
    VendorsModule,
    ProductsModule,
    InventoryModule,
    CategoriesModule,
    ReviewsModule,
    ReputationModule,
    OrdersModule,
    PaymentsModule,
    CommissionsModule,
    PayoutsModule,
    ShippingModule,
    ReturnsModule,
    DisputesModule,
    CouponsModule,
    WishlistsModule,
    ChatModule,
    NotificationsModule,
    QueueModule,
    AnalyticsModule,
    SearchModule,
    BannersModule,
    MarketplaceConfigModule,
    AuditModule,
    ReportsModule,
  ],
  providers: [
    // Orden de guards: Throttler → Maintenance → Auth → Roles
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: MaintenanceGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Filter global: formato { error: { code, message, details? } }
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    // Interceptor: POST/PATCH/DELETE → audit_logs
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
