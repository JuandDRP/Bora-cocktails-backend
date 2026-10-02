import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryRepository } from '../inventory/inventory.repository';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';
import { Consumption, ConsumptionDocument } from './schemas/consumption.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { QueryConsumptionDto } from './dto/query-consumption.dto';
import { DomainException, InsufficientStockException, InvalidInventoryOperationException } from '@/common/exceptions/domain.exceptions';
import { InventoryMovementType } from '@/common/constants/enums';
import { calculateInventoryStatus } from '@/common/utils/inventory.util';

@Injectable()
export class ConsumptionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Consumption.name) private readonly model: Model<ConsumptionDocument>,
    private readonly inventoryService: InventoryService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly movementsService: InventoryMovementsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async create(dto: CreateConsumptionDto, idempotencyKey: string) {
    const completed = await this.idempotencyService.getCompleted(idempotencyKey, 'CONSUMPTION_CREATE');
    if (completed?.response) return completed.response;

    const session = await this.connection.startSession();
    try {
      let response: Record<string, unknown> | undefined;
      await session.withTransaction(async () => {
        await this.idempotencyService.reserveOrThrow(idempotencyKey, 'CONSUMPTION_CREATE', session);

        const inventory = await this.inventoryService.resolveIdentity(dto, session);
        if (inventory.quantity < dto.quantity) {
          throw new InsufficientStockException(inventory.quantity, dto.quantity, inventory.unit);
        }

        if (dto.capacity !== undefined && inventory.capacity !== dto.capacity) {
          throw new InvalidInventoryOperationException('La capacidad indicada no coincide con la existencia.');
        }
        if (dto.capacityUnit !== undefined && inventory.capacityUnit !== dto.capacityUnit) {
          throw new InvalidInventoryOperationException('La unidad de capacidad no coincide con la existencia.');
        }

        if (dto.unit !== inventory.unit) {
          throw new InvalidInventoryOperationException('La unidad de consumo no coincide con la existencia.');
        }

        const totalConsumed = inventory.capacity
          ? Number((dto.quantity * inventory.capacity).toFixed(4))
          : undefined;
        const totalQuantityDelta = inventory.capacity
          ? Number((dto.quantity * inventory.capacity * -1).toFixed(4))
          : undefined;
        const equivalentUnitsDelta = inventory.equivalentUnitsPerItem
          ? Number((dto.quantity * inventory.equivalentUnitsPerItem * -1).toFixed(4))
          : undefined;

        const updated = await this.inventoryRepository.atomicIncrement(
          { _id: inventory._id, quantity: { $gte: dto.quantity } },
          -dto.quantity,
          { totalQuantity: totalQuantityDelta, equivalentUnits: equivalentUnitsDelta },
          {},
          session,
          false,
        );
        if (!updated) {
          const current = await this.inventoryRepository.findById(inventory._id, session);
          throw new InsufficientStockException(current?.quantity ?? 0, dto.quantity, inventory.unit);
        }

        const newStock = updated.quantity;
        const status = calculateInventoryStatus(newStock, inventory.minimumStock ?? 0);
        await this.inventoryRepository.updateById(updated._id, { status }, session);

        const movement = await this.movementsService.create(
          {
            inventoryId: inventory._id,
            productId: inventory.productId,
            flavorId: inventory.flavorId,
            mode: inventory.mode,
            movementType: InventoryMovementType.CONSUMO,
            quantity: dto.quantity,
            previousStock: updated.quantity + dto.quantity,
            newStock,
            unit: inventory.unit,
            reason: 'Consumo diario',
            notes: dto.notes,
            movementDate: new Date(dto.consumptionDate),
            totalQuantity: totalConsumed,
          },
          session,
        );

        const created = await this.model.create(
          [
            {
              inventoryId: inventory._id,
              productId: inventory.productId,
              flavorId: inventory.flavorId,
              mode: inventory.mode,
              presentation: inventory.presentation,
              capacity: inventory.capacity,
              capacityUnit: inventory.capacityUnit,
              quantity: dto.quantity,
              unit: dto.unit,
              consumptionDate: new Date(dto.consumptionDate),
              totalConsumed,
              totalConsumedUnit: inventory.capacityUnit,
              notes: dto.notes,
            },
          ],
          { session },
        );

        const createdConsumption = created[0];
        if (!createdConsumption) throw new Error('No fue posible registrar el consumo.');

        response = {
          consumption: createdConsumption.toObject(),
          inventory: { ...updated.toObject(), status },
          movement,
        } as unknown as Record<string, unknown>;

        await this.idempotencyService.markCompleted(idempotencyKey, 'CONSUMPTION_CREATE', response, session);
      });
      return response;
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: QueryConsumptionDto) {
    const filter: Record<string, unknown> = {};
    if (query.productId) filter.productId = query.productId;
    if (query.flavorId) filter.flavorId = query.flavorId;
    if (query.mode) filter.mode = query.mode;
    if (query.from || query.to) {
      filter.consumptionDate = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      };
    }
    return this.model.find(filter).sort({ consumptionDate: -1 }).lean().exec();
  }

  async findByDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new DomainException('INVALID_DATE', 'Fecha inválida. Use YYYY-MM-DD.', 400);
    }
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    return this.model.find({ consumptionDate: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean().exec();
  }
}
