import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FlavorNotFoundException } from '@/common/exceptions/domain.exceptions';
import { Flavor, FlavorDocument } from './schemas/flavor.schema';
import { CreateFlavorDto } from './dto/create-flavor.dto';
import { UpdateFlavorDto } from './dto/update-flavor.dto';
import { QueryFlavorDto } from './dto/query-flavor.dto';
import { FlavorMode } from '@/common/constants/enums';

@Injectable()
export class FlavorsService {
  constructor(@InjectModel(Flavor.name) private readonly flavorModel: Model<FlavorDocument>) {}

  async create(dto: CreateFlavorDto) {
    return (await this.flavorModel.create(dto)).toObject();
  }

  async findAll(query: QueryFlavorDto) {
    const filter: Record<string, unknown> = {};
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    if (query.mode) filter.mode = query.mode;
    if (query.active !== undefined) filter.active = query.active === 'true';
    return this.flavorModel.find(filter).sort({ name: 1 }).lean().exec();
  }

  async findById(id: string) {
    const flavor = await this.flavorModel.findById(id).lean().exec();
    if (!flavor) throw new FlavorNotFoundException(id);
    return flavor;
  }

  async findActiveByIds(ids: string[]) {
    const flavors = await this.flavorModel.find({ _id: { $in: ids }, active: true }).lean().exec();
    const found = new Set(flavors.map((item) => String(item._id)));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) throw new FlavorNotFoundException(missing[0]!);
    return flavors;
  }

  async update(id: string, dto: UpdateFlavorDto) {
    const flavor = await this.flavorModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!flavor) throw new FlavorNotFoundException(id);
    return flavor;
  }

  async findByMode(mode: FlavorMode) {
    return this.flavorModel.find({ mode, active: true }).sort({ name: 1 }).lean().exec();
  }
}
