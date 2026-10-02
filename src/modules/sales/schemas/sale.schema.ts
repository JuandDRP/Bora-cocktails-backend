import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FlavorMode, PaymentMethod, SaleComplexity, SaleDetailType } from '@/common/constants/enums';

@Schema({ _id: false })
export class SaleFlavorSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Flavor', required: true })
  flavorId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;
}

export const SaleFlavorSnapshotSchema = SchemaFactory.createForClass(SaleFlavorSnapshot);

@Schema({ _id: false })
export class SaleDetail {
  @Prop({ required: true, enum: SaleDetailType })
  type!: SaleDetailType;

  @Prop()
  sizeOz?: number;

  @Prop({ enum: FlavorMode })
  mode?: FlavorMode;

  @Prop({ type: [SaleFlavorSnapshotSchema], default: [] })
  flavors!: SaleFlavorSnapshot[];

  @Prop({ enum: SaleComplexity })
  complexity?: SaleComplexity;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  subtotal!: number;
}

export const SaleDetailSchema = SchemaFactory.createForClass(SaleDetail);

export type SaleDocument = HydratedDocument<Sale>;

@Schema({ timestamps: true, collection: 'sales' })
export class Sale {
  @Prop({ type: [SaleDetailSchema], required: true, minlength: 1 })
  details!: SaleDetail[];

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ enum: PaymentMethod, index: true })
  paymentMethod?: PaymentMethod;

  @Prop()
  notes?: string;

  @Prop({ type: Date, required: true, index: true })
  saleDate!: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
SaleSchema.index({ saleDate: -1 });
SaleSchema.index({ saleDate: -1, 'details.type': 1 });
SaleSchema.index({ saleDate: -1, 'details.sizeOz': 1 });
SaleSchema.index({ saleDate: -1, 'details.mode': 1 });
