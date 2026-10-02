import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProductCategory, ProductType } from '@/common/constants/enums';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, enum: ProductCategory, index: true })
  category!: ProductCategory;

  @Prop({ required: true, enum: ProductType, index: true })
  type!: ProductType;

  @Prop({ required: true, trim: true })
  unit!: string;

  @Prop({ default: true, index: true })
  active!: boolean;

  @Prop({ min: 0 })
  minimumStock?: number;

  @Prop({ trim: true })
  description?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1, type: 1, active: 1 });