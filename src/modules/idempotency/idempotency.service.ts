import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  IdempotencyInProgressException,
} from '@/common/exceptions/domain.exceptions';
import { IdempotencyRecord, IdempotencyDocument } from './schemas/idempotency.schema';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectModel(IdempotencyRecord.name)
    private readonly model: Model<IdempotencyDocument>,
  ) {}

  async getCompleted(key: string, operation: string) {
    return this.model.findOne({ key, operation, status: 'COMPLETED' }).lean().exec();
  }

  async reserveOrThrow(key: string, operation: string, session: ClientSession) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      await this.model.create(
        [
          {
            key,
            operation,
            status: 'PROCESSING',
            expiresAt,
          },
        ],
        { session },
      );
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        throw new IdempotencyInProgressException();
      }
      throw error;
    }
  }

  async markCompleted(
    key: string,
    operation: string,
    response: Record<string, unknown>,
    session: ClientSession,
  ) {
    await this.model.updateOne(
      { key, operation },
      { $set: { status: 'COMPLETED', response } },
      { session },
    ).exec();
  }
}
