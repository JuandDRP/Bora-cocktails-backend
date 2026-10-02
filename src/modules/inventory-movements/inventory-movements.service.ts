import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryMovement, InventoryMovementDocument } from './schemas/inventory-movement.schema';
import { QueryInventoryMovementDto } from './dto/query-inventory-movement.dto';
import { InventoryNotFoundException } from '@/common/exceptions/domain.exceptions';

@Injectable()
export class InventoryMovementsService {
  constructor(@InjectModel(InventoryMovement.name) private readonly model: Model<InventoryMovementDocument>) {}

  async findAll(query: QueryInventoryMovementDto) {
    const filter: Record<string, unknown> = {};
    if (query.inventoryId) filter.inventoryId = query.inventoryId;
    if (query.productId) filter.productId = query.productId;
    if (query.flavorId) filter.flavorId = query.flavorId;
    if (query.movementType) filter.movementType = query.movementType;
    if (query.mode) filter.mode = query.mode;

    if (query.from || query.to) {
      filter.movementDate = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      };
    }

    return this.model.find(filter).sort({ movementDate: -1 }).lean().exec();
  }

  async findById(id: string) {
    const movement = await this.model.findById(id).lean().exec();
    if (!movement) throw new InventoryNotFoundException(id);
    return movement;
  }

  async create(data: Partial<InventoryMovement>, session?: import('mongoose').ClientSession) {
    const created = await this.model.create([data], { session });
    const movement = created[0];
    if (!movement) throw new Error('No fue posible crear el movimiento.');
    return movement.toObject();
  }
}
