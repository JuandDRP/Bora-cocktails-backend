import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Types } from 'mongoose';
import {
  InsufficientStockException,
  InvalidInventoryOperationException,
  InventoryNotFoundException,
} from '@/common/exceptions/domain.exceptions';
import { InventoryMovementType, InventoryStatus } from '@/common/constants/enums';
import {
  calculateEquivalentUnits,
  calculateInventoryStatus,
  calculateTotalQuantity,
} from '@/common/utils/inventory.util';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { Inventory } from './schemas/inventory.schema';
import { InventoryRepository } from './inventory.repository';
import { InventoryEntryDto } from './dto/inventory-entry.dto';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ProductsService } from '../products/products.service';
import { FlavorsService } from '../flavors/flavors.service';
import { InventoryMovementsService } from '../inventory-movements/inventory-movements.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly repository: InventoryRepository,
    private readonly productsService: ProductsService,
    private readonly flavorsService: FlavorsService,
    private readonly movementsService: InventoryMovementsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async create(dto: CreateInventoryDto) {
    const product = await this.productsService.findActiveById(dto.productId);
    if (dto.flavorId) {
      if (!dto.mode) throw new InvalidInventoryOperationException('La modalidad es obligatoria cuando se especifica un sabor.');
      const flavor = await this.flavorsService.findById(dto.flavorId);
      if (dto.mode && flavor.mode !== dto.mode) {
        throw new InvalidInventoryOperationException('La modalidad no coincide con el sabor seleccionado.');
      }
    }

    const session = await this.connection.startSession();
    try {
      let response: Record<string, unknown> | undefined;
      await session.withTransaction(async () => {
        const identity = this.identityFilter(dto);
        const existing = await this.repository.findIdentity(identity, session);
        if (existing) {
          throw new InvalidInventoryOperationException(
            'La existencia ya existe. Utiliza una entrada para incrementar el stock.',
          );
        }

        const quantity = dto.quantity;
        const equivalentUnits = calculateEquivalentUnits(quantity, dto.equivalentUnitsPerItem);
        const totalQuantity = calculateTotalQuantity(quantity, dto.capacity);
        const status = calculateInventoryStatus(quantity, dto.minimumStock ?? product.minimumStock ?? 0);
        const created = await this.repository.create({
          ...identity,
          quantity,
          unit: dto.unit,
          equivalentUnits,
          equivalentUnitsPerItem: dto.equivalentUnitsPerItem,
          totalQuantity,
          minimumStock: dto.minimumStock ?? product.minimumStock,
          status,
          notes: dto.notes,
        }, session);
        const saved = created;

        await this.movementsService.create(
          {
            inventoryId: saved._id,
            productId: product._id,
            flavorId: dto.flavorId ? new Types.ObjectId(dto.flavorId) : undefined,
            mode: dto.mode,
            movementType: InventoryMovementType.ENTRADA,
            quantity,
            previousStock: 0,
            newStock: quantity,
            unit: dto.unit,
            reason: 'Creación de existencia',
            notes: dto.notes,
            movementDate: new Date(),
            totalQuantity,
          },
          session,
        );

        response = saved.toObject() as unknown as Record<string, unknown>;
      });
      return response;
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: QueryInventoryDto) {
    const filter: Record<string, unknown> = {};
    if (query.productId) filter.productId = query.productId;
    if (query.flavorId) filter.flavorId = query.flavorId;
    if (query.mode) filter.mode = query.mode;
    if (query.status) filter.status = query.status;
    if (query.presentation) filter.presentation = query.presentation;
    return this.repository.findMany(filter);
  }

  async findById(id: string) {
    const inventory = await this.repository.findById(id);
    if (!inventory) throw new InventoryNotFoundException(id);
    return inventory.toObject();
  }

  async update(id: string, dto: UpdateInventoryDto) {
    const current = await this.repository.findById(id);
    if (!current) throw new InventoryNotFoundException(id);

    const minimumStock = dto.minimumStock ?? current.minimumStock ?? 0;
    const updated = await this.repository.updateById(new Types.ObjectId(id), {
      ...dto,
      status: calculateInventoryStatus(current.quantity, minimumStock),
    });
    return updated?.toObject();
  }

  async registerEntry(dto: InventoryEntryDto, idempotencyKey: string) {
    const completed = await this.idempotencyService.getCompleted(idempotencyKey, 'INVENTORY_ENTRY');
    if (completed?.response) return completed.response;

    const product = await this.productsService.findActiveById(dto.productId);
    if (dto.flavorId) {
      if (!dto.mode) throw new InvalidInventoryOperationException('La modalidad es obligatoria cuando se especifica un sabor.');
      const flavor = await this.flavorsService.findById(dto.flavorId);
      if (dto.mode && flavor.mode !== dto.mode) {
        throw new InvalidInventoryOperationException('La modalidad no coincide con el sabor seleccionado.');
      }
    }

    const session = await this.connection.startSession();
    try {
      let response: Record<string, unknown> | undefined;
      await session.withTransaction(async () => {
        await this.idempotencyService.reserveOrThrow(idempotencyKey, 'INVENTORY_ENTRY', session);

        const identity = this.identityFilter(dto);
        const existing = await this.repository.findIdentity(identity, session);
        if (existing && dto.equivalentUnitsPerItem !== undefined &&
            existing.equivalentUnitsPerItem !== undefined &&
            existing.equivalentUnitsPerItem !== dto.equivalentUnitsPerItem) {
          throw new InvalidInventoryOperationException(
            'La equivalencia de unidades por item no coincide con la existencia existente.',
          );
        }

        const totalQuantityDelta = calculateTotalQuantity(dto.quantity, dto.capacity);
        const equivalentUnitsDelta = calculateEquivalentUnits(dto.quantity, dto.equivalentUnitsPerItem ?? existing?.equivalentUnitsPerItem);
        const minimumStock = dto.minimumStock ?? existing?.minimumStock ?? product.minimumStock ?? 0;

        const updated = await this.repository.atomicIncrement(
          identity,
          dto.quantity,
          { totalQuantity: totalQuantityDelta, equivalentUnits: equivalentUnitsDelta },
          {
            ...identity,
            unit: dto.unit,
            equivalentUnitsPerItem: dto.equivalentUnitsPerItem ?? existing?.equivalentUnitsPerItem,
            minimumStock,
            status: calculateInventoryStatus((existing?.quantity ?? 0) + dto.quantity, minimumStock),
            notes: dto.notes,
          },
          session,
        );

        if (!updated) throw new InvalidInventoryOperationException('No fue posible actualizar el inventario.');

        const previousStock = updated.quantity - dto.quantity;
        const status = calculateInventoryStatus(updated.quantity, minimumStock);
        await this.repository.updateById(updated._id, { status, minimumStock }, session);
        const movement = await this.movementsService.create(
          {
            inventoryId: updated._id,
            productId: product._id,
            flavorId: dto.flavorId ? new Types.ObjectId(dto.flavorId) : undefined,
            mode: dto.mode,
            movementType: InventoryMovementType.ENTRADA,
            quantity: dto.quantity,
            previousStock,
            newStock: updated.quantity,
            unit: dto.unit,
            reason: dto.reason ?? 'Entrada de inventario',
            notes: dto.notes,
            movementDate: new Date(),
            totalQuantity: totalQuantityDelta,
          },
          session,
        );

        const result = { inventory: { ...updated.toObject(), status }, movement };
        response = result as unknown as Record<string, unknown>;
        await this.idempotencyService.markCompleted(idempotencyKey, 'INVENTORY_ENTRY', response, session);
      });
      return response;
    } finally {
      await session.endSession();
    }
  }

  async registerAdjustment(dto: InventoryAdjustmentDto, idempotencyKey: string) {
    const completed = await this.idempotencyService.getCompleted(idempotencyKey, 'INVENTORY_ADJUSTMENT');
    if (completed?.response) return completed.response;

    const session = await this.connection.startSession();
    try {
      let response: Record<string, unknown> | undefined;
      await session.withTransaction(async () => {
        await this.idempotencyService.reserveOrThrow(idempotencyKey, 'INVENTORY_ADJUSTMENT', session);
        const inventory = await this.repository.findById(dto.inventoryId, session);
        if (!inventory) throw new InventoryNotFoundException(dto.inventoryId);

        const newStock = inventory.quantity + dto.quantityDelta;
        if (newStock < 0) {
          throw new InsufficientStockException(inventory.quantity, Math.abs(dto.quantityDelta), inventory.unit);
        }

        const totalQuantityDelta = inventory.capacity
          ? Number((dto.quantityDelta * inventory.capacity).toFixed(4))
          : undefined;
        const equivalentUnitsDelta = inventory.equivalentUnitsPerItem
          ? Number((dto.quantityDelta * inventory.equivalentUnitsPerItem).toFixed(4))
          : undefined;
        const adjustmentFilter = dto.quantityDelta < 0
          ? { _id: inventory._id, quantity: { $gte: Math.abs(dto.quantityDelta) } }
          : { _id: inventory._id };
        const updated = await this.repository.atomicIncrement(
          adjustmentFilter,
          dto.quantityDelta,
          { totalQuantity: totalQuantityDelta, equivalentUnits: equivalentUnitsDelta },
          {},
          session,
          false,
        );
        if (!updated) throw new InsufficientStockException(inventory.quantity, Math.abs(dto.quantityDelta), inventory.unit);

        const status = calculateInventoryStatus(newStock, inventory.minimumStock ?? 0);
        await this.repository.updateById(updated._id, { status }, session);
        const movement = await this.movementsService.create(
          {
            inventoryId: updated._id,
            productId: updated.productId,
            flavorId: updated.flavorId,
            mode: updated.mode,
            movementType: InventoryMovementType.AJUSTE,
            quantity: dto.quantityDelta,
            previousStock: inventory.quantity,
            newStock,
            unit: inventory.unit,
            reason: dto.reason,
            notes: dto.notes,
            movementDate: new Date(),
            totalQuantity: totalQuantityDelta,
          },
          session,
        );
        response = { inventory: { ...updated.toObject(), status }, movement } as unknown as Record<string, unknown>;
        await this.idempotencyService.markCompleted(idempotencyKey, 'INVENTORY_ADJUSTMENT', response, session);
      });
      return response;
    } finally {
      await session.endSession();
    }
  }

  async resolveIdentity(dto: {
    productId: string;
    flavorId?: string;
    mode?: import('@/common/constants/enums').FlavorMode;
    presentation: string;
    capacity?: number;
    capacityUnit?: string;
  }, session?: ClientSession) {
    if (dto.flavorId && !dto.mode) {
      throw new InvalidInventoryOperationException('La modalidad es obligatoria cuando se especifica un sabor.');
    }
    const inventory = await this.repository.findIdentity(this.identityFilter(dto), session);
    if (!inventory) {
      throw new InvalidInventoryOperationException('No existe una existencia que coincida con la combinación indicada.');
    }
    return inventory;
  }

  private identityFilter(dto: {
    productId: string;
    flavorId?: string;
    mode?: import('@/common/constants/enums').FlavorMode;
    presentation: string;
    capacity?: number;
    capacityUnit?: string;
  }) {
    return {
      productId: new Types.ObjectId(dto.productId),
      ...(dto.flavorId ? { flavorId: new Types.ObjectId(dto.flavorId) } : {}),
      ...(dto.mode ? { mode: dto.mode } : {}),
      presentation: dto.presentation.trim(),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.capacityUnit ? { capacityUnit: dto.capacityUnit.trim() } : {}),
    };
  }
}
