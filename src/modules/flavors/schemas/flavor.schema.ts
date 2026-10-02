import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FlavorMode } from '@/common/constants/enums';

export type FlavorDocument = HydratedDocument<Flavor>;

@Schema({ timestamps: true, collection: 'flavors' })
export class Flavor {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, enum: FlavorMode, index: true })
  mode!: FlavorMode;

  @Prop({ default: true, index: true })
  active!: boolean;

  @Prop({ trim: true })
  description?: string;
}

export const FlavorSchema = SchemaFactory.createForClass(Flavor);
FlavorSchema.index({ name: 1, mode: 1 }, { unique: true });
FlavorSchema.index({ mode: 1, active: 1 });
