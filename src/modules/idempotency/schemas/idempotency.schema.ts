import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IdempotencyDocument = HydratedDocument<IdempotencyRecord>;

@Schema({ timestamps: true, collection: 'idempotency_records' })
export class IdempotencyRecord {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true, index: true })
  operation!: string;

  @Prop({ required: true, enum: ['PROCESSING', 'COMPLETED'] })
  status!: 'PROCESSING' | 'COMPLETED';

  @Prop({ type: Object })
  response?: Record<string, unknown>;

  @Prop({ type: Date, index: { expireAfterSeconds: 86400 } })
  expiresAt!: Date;
}

export const IdempotencySchema = SchemaFactory.createForClass(IdempotencyRecord);
IdempotencySchema.index({ key: 1, operation: 1 }, { unique: true });
