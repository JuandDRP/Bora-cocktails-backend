import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PricingType } from '@/common/constants/enums';

export type PricingDocument = HydratedDocument<Pricing>;

@Schema({ timestamps: true, collection: 'pricing' })
export class Pricing {
  @Prop({ required: true, enum: PricingType, index: true })
  type!: PricingType;

  @Prop({ min: 1, index: true })
  sizeOz?: number;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, default: 'COP' })
  currency!: string;

  @Prop({ default: true, index: true })
  active!: boolean;

  @Prop({ type: Date, index: true })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ trim: true })
  description?: string;
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);
PricingSchema.index({ type: 1, sizeOz: 1, active: 1 });
