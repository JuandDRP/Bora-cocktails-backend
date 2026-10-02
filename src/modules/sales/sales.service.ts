import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { FlavorsService } from '../flavors/flavors.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateSaleDto, SaleDetailInputDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { PricingType, SaleComplexity, SaleDetailType } from '@/common/constants/enums';
import { calculateLineSubtotal, calculateSaleTotal, classifyComplexity } from '@/common/utils/sales.util';
import { DomainException, InvalidSaleException } from '@/common/exceptions/domain.exceptions';

@Injectable()
export class SalesService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Sale.name) private readonly model: Model<SaleDocument>,
    private readonly idempotencyService: IdempotencyService,
    private readonly flavorsService: FlavorsService,
    private readonly pricingService: PricingService,
  ) {}

  async create(dto: CreateSaleDto, idempotencyKey: string) {
    const completed = await this.idempotencyService.getCompleted(idempotencyKey, 'SALE_CREATE');
    if (completed?.response) return completed.response;

    const session = await this.connection.startSession();
    try {
      let response: Record<string, unknown> | undefined;
      await session.withTransaction(async () => {
        await this.idempotencyService.reserveOrThrow(idempotencyKey, 'SALE_CREATE', session);

        const details = [];
        for (const input of dto.details) {
          details.push(await this.buildDetail(input, new Date(dto.saleDate)));
        }

        const subtotal = calculateSaleTotal(details.map((d) => d.subtotal));
        const total = subtotal;
        const sale = await this.model.create(
          [{
            details,
            subtotal,
            total,
            paymentMethod: dto.paymentMethod,
            notes: dto.notes,
            saleDate: new Date(dto.saleDate),
          }],
          { session },
        );

        const createdSale = sale[0];
        if (!createdSale) throw new Error('No fue posible crear la venta.');
        response = createdSale.toObject() as unknown as Record<string, unknown>;
        await this.idempotencyService.markCompleted(idempotencyKey, 'SALE_CREATE', response, session);
      });
      return response;
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: QuerySalesDto) {
    const filter: Record<string, unknown> = {};
    if (query.from || query.to) {
      filter.saleDate = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      };
    }
    if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

    const detailFilter: Record<string, unknown> = {};
    if (query.type) detailFilter['details.type'] = query.type;
    if (query.mode) detailFilter['details.mode'] = query.mode;
    if (query.complexity) detailFilter['details.complexity'] = query.complexity;
    if (query.sizeOz) detailFilter['details.sizeOz'] = query.sizeOz;
    if (query.flavorId) detailFilter['details.flavors.flavorId'] = new Types.ObjectId(query.flavorId);

    return this.model.find({ ...filter, ...detailFilter }).sort({ saleDate: -1 }).lean().exec();
  }

  async findById(id: string) {
    const sale = await this.model.findById(id).lean().exec();
    if (!sale) throw new InvalidSaleException(`Venta no encontrada: ${id}`);
    return sale;
  }

  async findByDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new DomainException('INVALID_DATE', 'Fecha inválida. Use YYYY-MM-DD.', 400);
    }
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    return this.model.find({ saleDate: { $gte: start, $lte: end } }).sort({ saleDate: -1 }).lean().exec();
  }

  async summary(from: Date, to: Date) {
    const base = { saleDate: { $gte: from, $lte: to } };
    const sales = await this.model.find(base).lean().exec();
    let totalSold = 0;
    let glasses = 0;
    let syringes = 0;
    let revenue = 0;
    const bySize: Record<string, { quantity: number; revenue: number }> = {};
    const byMode: Record<string, { quantity: number; revenue: number }> = {};
    const byFlavor: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const byComplexity: Record<string, { quantity: number; revenue: number }> = {};

    for (const sale of sales) {
      totalSold += 1;
      revenue += sale.total;
      for (const detail of sale.details) {
        if (detail.type === SaleDetailType.VASO) {
          glasses += detail.quantity;
          const sizeKey = String(detail.sizeOz ?? 'unknown');
          bySize[sizeKey] ??= { quantity: 0, revenue: 0 };
          bySize[sizeKey].quantity += detail.quantity;
          bySize[sizeKey].revenue += detail.subtotal;

          const modeKey = detail.mode ?? 'SIN_DEFINIR';
          byMode[modeKey] ??= { quantity: 0, revenue: 0 };
          byMode[modeKey].quantity += detail.quantity;
          byMode[modeKey].revenue += detail.subtotal;

          const complexityKey = detail.complexity ?? classifyComplexity(detail.flavors.length);
          byComplexity[complexityKey] ??= { quantity: 0, revenue: 0 };
          byComplexity[complexityKey].quantity += detail.quantity;
          byComplexity[complexityKey].revenue += detail.subtotal;

          for (const flavor of detail.flavors) {
            const key = String(flavor.flavorId);
            byFlavor[key] ??= { name: flavor.name, quantity: 0, revenue: 0 };
            byFlavor[key].quantity += detail.quantity;
            byFlavor[key].revenue += Number((detail.subtotal / detail.flavors.length).toFixed(2));
          }
        } else if (detail.type === SaleDetailType.JERINGA) {
          syringes += detail.quantity;
        }
      }
    }

    return {
      salesCount: totalSold,
      revenue,
      glasses,
      syringes,
      bySize,
      byMode,
      byFlavor,
      byComplexity,
    };
  }

  private async buildDetail(input: SaleDetailInputDto, saleDate: Date) {
    if (input.quantity <= 0) throw new InvalidSaleException('La cantidad debe ser mayor que cero.');

    if (input.type === SaleDetailType.VASO) {
      if (!input.sizeOz || ![12, 16].includes(input.sizeOz)) {
        throw new InvalidSaleException('El tamaño del vaso debe ser 12 o 16 oz.');
      }
      const flavors = input.flavors ?? [];
      if (flavors.length < 1) throw new InvalidSaleException('Un vaso debe tener al menos un sabor.');
      if (flavors.length > 10) throw new InvalidSaleException('Un vaso no puede tener más de 10 sabores.');

      const flavorIds = flavors.map((item) => item.flavorId);
      if (new Set(flavorIds).size !== flavorIds.length) {
        throw new InvalidSaleException('Un vaso no puede repetir el mismo sabor en una línea.');
      }
      const flavorDocs = await this.flavorsService.findActiveByIds(flavorIds);
      const modeSet = new Set(flavorDocs.map((flavor) => flavor.mode));
      if (modeSet.size > 1) {
        throw new InvalidSaleException('Un combinado no puede mezclar modalidades CON_LICOR y SIN_LICOR.');
      }
      const mode = input.mode ?? [...modeSet][0];
      if (mode && !modeSet.has(mode)) throw new InvalidSaleException('La modalidad no coincide con los sabores seleccionados.');

      const unitPrice = await this.pricingService.getActivePrice(PricingType.VASO, input.sizeOz, saleDate);
      const subtotal = calculateLineSubtotal(input.quantity, unitPrice);
      const complexity = classifyComplexity(flavorDocs.length);

      return {
        type: SaleDetailType.VASO,
        sizeOz: input.sizeOz,
        mode,
        flavors: flavorDocs.map((flavor) => ({
          flavorId: flavor._id,
          name: flavor.name,
        })),
        complexity,
        quantity: input.quantity,
        unitPrice,
        subtotal,
      };
    }

    if (input.type === SaleDetailType.JERINGA) {
      if (input.flavors?.length || input.mode || input.sizeOz) {
        throw new InvalidSaleException('Una jeringa no admite tamaño ni sabores de vaso.');
      }
      const unitPrice = await this.pricingService.getActivePrice(PricingType.JERINGA, undefined, saleDate);
      const subtotal = calculateLineSubtotal(input.quantity, unitPrice);
      return {
        type: SaleDetailType.JERINGA,
        quantity: input.quantity,
        unitPrice,
        subtotal,
      };
    }

    throw new InvalidSaleException('Tipo de detalle de venta no soportado.');
  }
}
