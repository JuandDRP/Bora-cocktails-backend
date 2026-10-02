import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { ProductsModule } from './modules/products/products.module';
import { FlavorsModule } from './modules/flavors/flavors.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { ConsumptionModule } from './modules/consumption/consumption.module';
import { SalesModule } from './modules/sales/sales.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('app.mongodbUri'),
        autoIndex: true,
        serverSelectionTimeoutMS: 10_000,
      }),
    }),
    IdempotencyModule,
    ProductsModule,
    FlavorsModule,
    InventoryModule,
    InventoryMovementsModule,
    ConsumptionModule,
    PricingModule,
    SalesModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
