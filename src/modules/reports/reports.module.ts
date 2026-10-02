import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { Inventory, InventorySchema } from '../inventory/schemas/inventory.schema';
import { Consumption, ConsumptionSchema } from '../consumption/schemas/consumption.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Flavor, FlavorSchema } from '../flavors/schemas/flavor.schema';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Consumption.name, schema: ConsumptionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Flavor.name, schema: FlavorSchema },
    ]),
    SalesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
