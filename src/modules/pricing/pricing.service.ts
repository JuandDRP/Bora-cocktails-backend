import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pricing, PricingDocument } from './schemas/pricing.schema';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { PricingType } from '@/common/constants/enums';
import { InvalidSaleException, DomainException } from '@/common/exceptions/domain.exceptions';

@Injectable()
export class PricingService {
  constructor(@InjectModel(Pricing.name) private readonly model: Model<PricingDocument>) {}

  async create(dto: CreatePricingDto) {
    return (await this.model.create({
      ...dto,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
    })).toObject();
  }

  async findAll() {
    return this.model.find().sort({ type: 1, sizeOz: 1, effectiveFrom: -1 }).lean().exec();
  }

  async findById(id: string) {
    const pricing = await this.model.findById(id).lean().exec();
    if (!pricing) throw new DomainException('PRICING_NOT_FOUND', `Precio no encontrado: ${id}`, 404);
    return pricing;
  }

  async update(id: string, dto: UpdatePricingDto) {
    const updated = await this.model.findByIdAndUpdate(id, {
      ...dto,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
    }, { new: true, runValidators: true }).lean().exec();
    if (!updated) throw new DomainException('PRICING_NOT_FOUND', `Precio no encontrado: ${id}`, 404);
    return updated;
  }

  async getActivePrice(type: PricingType, sizeOz?: number, at = new Date()): Promise<number> {
    const filter: Record<string, unknown> = {
      type,
      active: true,
      ...(type === PricingType.VASO ? { sizeOz } : {}),
    };
    const nowFilter = {
      $or: [
        { effectiveFrom: { $exists: false } },
        { effectiveFrom: null },
        { effectiveFrom: { $lte: at } },
      ],
      $and: [
        {
          $or: [
            { effectiveTo: { $exists: false } },
            { effectiveTo: null },
            { effectiveTo: { $gte: at } },
          ],
        },
      ],
    };
    const price = await this.model.findOne({ ...filter, ...nowFilter }).sort({ effectiveFrom: -1 }).lean().exec();
    if (!price) {
      throw new InvalidSaleException(
        `No existe un precio activo para ${type}${sizeOz ? ` ${sizeOz} oz` : ''}.`,
      );
    }
    return price.amount;
  }
}
