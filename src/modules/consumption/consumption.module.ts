import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Consumption, ConsumptionSchema } from './schemas/consumption.schema';
import { ConsumptionController } from './consumption.controller';
import { ConsumptionService } from './consumption.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Consumption.name, schema: ConsumptionSchema }]),
    InventoryModule,
    InventoryMovementsModule,
    IdempotencyModule,
  ],
  controllers: [ConsumptionController],
  providers: [ConsumptionService],
  exports: [ConsumptionService],
})
export class ConsumptionModule {}
