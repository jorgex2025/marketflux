import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    // ConfigModule global — carga .env en todos los módulos
    ConfigModule.forRoot({ isGlobal: true }),
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
})
export class AppModule {}
