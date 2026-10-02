import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReportQueryDto } from './dto/report-query.dto';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { Inventory, InventoryDocument } from '../inventory/schemas/inventory.schema';
import { Consumption, ConsumptionDocument } from '../consumption/schemas/consumption.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Flavor, FlavorDocument } from '../flavors/schemas/flavor.schema';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<SaleDocument>,
    @InjectModel(Inventory.name) private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(Consumption.name) private readonly consumptionModel: Model<ConsumptionDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Flavor.name) private readonly flavorModel: Model<FlavorDocument>,
    private readonly salesService: SalesService,
  ) {}

  async sales(query: ReportQueryDto) {
    const { from, to } = this.resolveRange(query);
    const summary = await this.salesService.summary(from, to);
    const sales = await this.saleModel.find(this.buildSaleFilter(query, from, to)).sort({ saleDate: -1 }).lean().exec();
    return { range: { from, to }, summary, sales };
  }

  async inventory(query: ReportQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.productId) filter.productId = new Types.ObjectId(query.productId);
    if (query.flavorId) filter.flavorId = new Types.ObjectId(query.flavorId);
    if (query.mode) filter.mode = query.mode;
    if (query.status) filter.status = query.status;
    if (query.presentation) filter.presentation = query.presentation;
    const items = await this.inventoryModel.find(filter).sort({ updatedAt: -1 }).lean().exec();
    return {
      filters: query,
      totalRecords: items.length,
      items,
    };
  }

  async consumption(query: ReportQueryDto) {
    const { from, to } = this.resolveRange(query);
    const filter: Record<string, unknown> = { consumptionDate: { $gte: from, $lte: to } };
    if (query.productId) filter.productId = new Types.ObjectId(query.productId);
    if (query.flavorId) filter.flavorId = new Types.ObjectId(query.flavorId);
    if (query.mode) filter.mode = query.mode;
    const items = await this.consumptionModel.find(filter).sort({ consumptionDate: -1 }).lean().exec();
    const totalConsumed = items.reduce((sum, item) => sum + (item.totalConsumed ?? 0), 0);
    return { range: { from, to }, totalConsumed: Number(totalConsumed.toFixed(4)), items };
  }

  async products(query: ReportQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.productId) filter._id = new Types.ObjectId(query.productId);
    const products = await this.productModel.find(filter).sort({ name: 1 }).lean().exec();
    const inventory = await this.inventoryModel.find(
      query.productId ? { productId: new Types.ObjectId(query.productId) } : {},
    ).lean().exec();
    return { products, inventoryCount: inventory.length, inventory };
  }

  async flavors(query: ReportQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.flavorId) filter._id = new Types.ObjectId(query.flavorId);
    if (query.mode) filter.mode = query.mode;
    const flavors = await this.flavorModel.find(filter).sort({ name: 1 }).lean().exec();

    const { from, to } = this.resolveRange(query);
    const summary = await this.salesService.summary(from, to);
    return { range: { from, to }, flavors, salesByFlavor: summary.byFlavor };
  }

  private resolveRange(query: ReportQueryDto): { from: Date; to: Date } {
    const now = new Date();
    const from = query.from ? new Date(query.from) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = query.to ? new Date(query.to) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { from, to };
  }

  private buildSaleFilter(query: ReportQueryDto, from: Date, to: Date) {
    const filter: Record<string, unknown> = { saleDate: { $gte: from, $lte: to } };
    if (query.flavorId) filter['details.flavors.flavorId'] = new Types.ObjectId(query.flavorId);
    if (query.mode) filter['details.mode'] = query.mode;
    if (query.complexity) filter['details.complexity'] = query.complexity;
    if (query.sizeOz) filter['details.sizeOz'] = query.sizeOz;
    return filter;
  }
}
