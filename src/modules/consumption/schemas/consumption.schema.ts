import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FlavorMode } from '@/common/constants/enums';

export type ConsumptionDocument = HydratedDocument<Consumption>;

@Schema({ timestamps: true, collection: 'consumption' })
export class Consumption {
  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true, index: true })
  inventoryId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Flavor', index: true })
  flavorId?: Types.ObjectId;

  @Prop({ enum: FlavorMode, index: true })
  mode?: FlavorMode;

  @Prop({ required: true })
  presentation!: string;

  @Prop({ min: 0 })
  capacity?: number;

  @Prop() 
  capacityUnit?: string;

  @Prop({ required: true, min: 0 })
  quantity!: number;

  @Prop({ required: true })
  unit!: string;

  @Prop({ required: true, index: true })
  consumptionDate!: Date;

  @Prop({ min: 0 })
  totalConsumed?: number;

  @Prop()
  totalConsumedUnit?: string;

  @Prop()
  notes?: string;
}

export const ConsumptionSchema = SchemaFactory.createForClass(Consumption);
ConsumptionSchema.index({ consumptionDate: -1, productId: 1 });
ConsumptionSchema.index({ consumptionDate: -1, flavorId: 1 });
