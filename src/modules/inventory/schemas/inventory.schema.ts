import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FlavorMode, InventoryStatus } from '@/common/constants/enums';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true, collection: 'inventory' })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Flavor', index: true })
  flavorId?: Types.ObjectId;

  @Prop({ enum: FlavorMode, index: true })
  mode?: FlavorMode;

  @Prop({ required: true, trim: true, index: true })
  presentation!: string;

  @Prop({ min: 0, index: true })
  capacity?: number;

  @Prop({ trim: true })
  capacityUnit?: string;

  @Prop({ required: true, min: 0, index: true })
  quantity!: number;

  @Prop({ required: true, trim: true })
  unit!: string;

  @Prop({ min: 0 })
  equivalentUnits?: number;

  @Prop({ min: 0 })
  equivalentUnitsPerItem?: number;

  @Prop({ min: 0 })
  totalQuantity?: number;

  @Prop({ min: 0 })
  minimumStock?: number;

  @Prop({ required: true, enum: InventoryStatus, index: true })
  status!: InventoryStatus;

  @Prop({ trim: true })
  notes?: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
InventorySchema.index({ productId: 1, flavorId: 1, mode: 1, presentation: 1, capacity: 1, capacityUnit: 1 }, { unique: true });
InventorySchema.index({ status: 1, quantity: 1 });
InventorySchema.index({ productId: 1, status: 1 });
InventorySchema.index({ flavorId: 1, status: 1 });
