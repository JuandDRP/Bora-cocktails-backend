import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { ProductsModule } from '../products/products.module';
import { FlavorsModule } from '../flavors/flavors.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }]),
    ProductsModule,
    FlavorsModule,
    InventoryMovementsModule,
    IdempotencyModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
