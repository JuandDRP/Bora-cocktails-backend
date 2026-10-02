import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductNotFoundException } from '@/common/exceptions/domain.exceptions';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {}

  async create(dto: CreateProductDto) {
    const product = await this.productModel.create(dto);
    return product.toObject();
  }

  async findAll(query: QueryProductDto) {
    const filter: Record<string, unknown> = {};
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    if (query.category) filter.category = query.category;
    if (query.type) filter.type = query.type;
    if (query.active !== undefined) filter.active = query.active === 'true';

    return this.productModel.find(filter).sort({ name: 1 }).lean().exec();
  }

  async findById(id: string) {
    const product = await this.productModel.findById(id).lean().exec();
    if (!product) throw new ProductNotFoundException(id);
    return product;
  }

  async findActiveById(id: string) {
    const product = await this.productModel.findOne({ _id: id, active: true }).lean().exec();
    if (!product) throw new ProductNotFoundException(id);
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!product) throw new ProductNotFoundException(id);
    return product;
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      { active: false },
      { new: true },
    ).lean().exec();
    if (!product) throw new ProductNotFoundException(id);
    return product;
  }
}
