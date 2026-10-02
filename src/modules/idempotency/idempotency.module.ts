import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdempotencyRecord, IdempotencySchema } from './schemas/idempotency.schema';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: IdempotencyRecord.name, schema: IdempotencySchema }])],
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
