import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { Inventory, InventoryDocument } from '../inventory/schemas/inventory.schema';
import { Consumption, ConsumptionDocument } from '../consumption/schemas/consumption.schema';
import { InventoryMovement, InventoryMovementDocument } from '../inventory-movements/schemas/inventory-movement.schema';
import { SalesService } from '../sales/sales.service';
import { InventoryStatus, SaleDetailType } from '@/common/constants/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<SaleDocument>,
    @InjectModel(Inventory.name) private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(Consumption.name) private readonly consumptionModel: Model<ConsumptionDocument>,
    @InjectModel(InventoryMovement.name) private readonly movementModel: Model<InventoryMovementDocument>,
    private readonly salesService: SalesService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const startToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const startMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const [today, month, inventory, lowStock, exhausted, todayConsumption, latestSales, latestMovements] = await Promise.all([
      this.salesService.summary(startToday, endToday),
      this.salesService.summary(startMonth, endMonth),
      this.inventoryModel.find().lean().exec(),
      this.inventoryModel.find({ status: InventoryStatus.STOCK_BAJO }).sort({ quantity: 1 }).lean().exec(),
      this.inventoryModel.find({ status: InventoryStatus.AGOTADO }).sort({ updatedAt: -1 }).lean().exec(),
      this.consumptionModel.find({ consumptionDate: { $gte: startToday, $lte: endToday } }).lean().exec(),
      this.saleModel.find().sort({ saleDate: -1 }).limit(10).lean().exec(),
      this.movementModel.find().sort({ movementDate: -1 }).limit(10).lean().exec(),
    ]);

    const inventoryByUnit = inventory.reduce(
      (acc, item) => {
        const key = item.unit;
        acc[key] = (acc[key] ?? 0) + item.quantity;
        return acc;
      },
      {} as Record<string, number>,
    );

    const liters = inventory.reduce((sum, item) => {
      if (item.capacityUnit?.toUpperCase() === 'L' && item.capacity) return sum + item.quantity * item.capacity;
      return sum;
    }, 0);

    const consumptionTotal = todayConsumption.reduce((sum, item) => sum + (item.totalConsumed ?? 0), 0);

    return {
      today,
      month,
      inventory: {
        totalRecords: inventory.length,
        totalStockByUnit: inventoryByUnit,
        litersAvailable: Number(liters.toFixed(4)),
        equivalentUnitsAvailable: inventory.reduce((sum, item) => sum + (item.equivalentUnits ?? 0), 0),
      },
      lowStock,
      exhausted,
      consumptionToday: {
        records: todayConsumption.length,
        totalConsumed: Number(consumptionTotal.toFixed(4)),
        items: todayConsumption,
      },
      latestSales,
      latestMovements,
    };
  }
}
