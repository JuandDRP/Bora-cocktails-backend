import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FlavorMode, InventoryMovementType } from '@/common/constants/enums';

export type InventoryMovementDocument = HydratedDocument<InventoryMovement>;

@Schema({ timestamps: true, collection: 'inventory_movements' })
export class InventoryMovement {
  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true, index: true })
  inventoryId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Flavor', index: true })
  flavorId?: Types.ObjectId;

  @Prop({ enum: FlavorMode, index: true })
  mode?: FlavorMode;

  @Prop({ required: true, enum: InventoryMovementType, index: true })
  movementType!: InventoryMovementType;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  previousStock!: number;

  @Prop({ required: true, min: 0 })
  newStock!: number;

  @Prop({ required: true })
  unit!: string;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Date, required: true, index: true })
  movementDate!: Date;

  @Prop({ min: 0 })
  totalQuantity?: number;
}

export const InventoryMovementSchema = SchemaFactory.createForClass(InventoryMovement);
InventoryMovementSchema.index({ movementDate: -1, movementType: 1 });
InventoryMovementSchema.index({ productId: 1, movementDate: -1 });
InventoryMovementSchema.index({ flavorId: 1, movementDate: -1 });
