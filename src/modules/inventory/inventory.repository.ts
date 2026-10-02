import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, QueryFilter, Types } from 'mongoose';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class InventoryRepository {
  constructor(@InjectModel(Inventory.name) private readonly model: Model<InventoryDocument>) {}

  findById(id: string | Types.ObjectId, session?: ClientSession) {
    return this.model.findById(id).session(session ?? null).exec();
  }

  async create(data: Partial<Inventory>, session?: ClientSession) {
    const docs = await this.model.create([data], { session });
    const doc = docs[0];
    if (!doc) throw new Error('No fue posible crear la existencia.');
    return doc;
  }

  findIdentity(filter: QueryFilter<Inventory>, session?: ClientSession) {
    return this.model.findOne(filter).session(session ?? null).exec();
  }

  findMany(filter: QueryFilter<Inventory>) {
    return this.model.find(filter).sort({ updatedAt: -1 }).lean().exec();
  }

  updateById(id: Types.ObjectId, update: Record<string, unknown>, session?: ClientSession) {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true, session: session ?? null }).exec();
  }

  atomicIncrement(
    filter: QueryFilter<Inventory>,
    quantityDelta: number,
    totalsDelta: { equivalentUnits?: number; totalQuantity?: number },
    onInsert: Partial<Inventory>,
    session: ClientSession,
    upsert = true,
  ) {
    const $inc: Record<string, number> = { quantity: quantityDelta };
    if (totalsDelta.equivalentUnits !== undefined) $inc.equivalentUnits = totalsDelta.equivalentUnits;
    if (totalsDelta.totalQuantity !== undefined) $inc.totalQuantity = totalsDelta.totalQuantity;

    return this.model.findOneAndUpdate(
      filter,
      {
        $inc,
        $setOnInsert: onInsert,
      },
      {
        new: true,
        upsert,
        runValidators: true,
        session,
      },
    ).exec();
  }
}
