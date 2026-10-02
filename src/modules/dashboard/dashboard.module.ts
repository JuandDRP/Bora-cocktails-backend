import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { Inventory, InventorySchema } from '../inventory/schemas/inventory.schema';
import { Consumption, ConsumptionSchema } from '../consumption/schemas/consumption.schema';
import { InventoryMovement, InventoryMovementSchema } from '../inventory-movements/schemas/inventory-movement.schema';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Consumption.name, schema: ConsumptionSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
    ]),
    SalesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
