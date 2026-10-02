import 'reflect-metadata';
import 'dotenv/config';
import { connect, Types } from 'mongoose';
import { ProductCategory, ProductType, FlavorMode, PricingType } from '@/common/constants/enums';
import { ProductSchema } from '@/modules/products/schemas/product.schema';
import { FlavorSchema } from '@/modules/flavors/schemas/flavor.schema';
import { PricingSchema } from '@/modules/pricing/schemas/pricing.schema';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está configurada.');

  const connection = await connect(uri);
  const ProductModel = connection.model('Product', ProductSchema);
  const FlavorModel = connection.model('Flavor', FlavorSchema);
  const PricingModel = connection.model('Pricing', PricingSchema);

  const products = [
    ['Granizado', ProductCategory.GRANIZADO, ProductType.LIQUIDO_GRANIZADO, 'BOLSA'],
    ['Gomitas', ProductCategory.TOPPING, ProductType.GOMITAS, 'PAQUETE'],
    ['Perlas', ProductCategory.TOPPING, ProductType.PERLAS, 'PAQUETE'],
    ['Chicles', ProductCategory.TOPPING, ProductType.CHICLES, 'PAQUETE'],
    ['Vasos', ProductCategory.EMPAQUE, ProductType.VASOS, 'UNIDAD'],
    ['Tapas', ProductCategory.EMPAQUE, ProductType.TAPAS, 'UNIDAD'],
    ['Pitillos', ProductCategory.EMPAQUE, ProductType.PITILLOS, 'UNIDAD'],
    ['Jeringas', ProductCategory.EMPAQUE, ProductType.JERINGAS, 'UNIDAD'],
  ] as const;

  for (const [name, category, type, unit] of products) {
    await ProductModel.updateOne({ name }, { $setOnInsert: { name, category, type, unit, active: true } }, { upsert: true });
  }

  const flavors = [
    ['Frutos rojos', FlavorMode.CON_LICOR],
    ['Mora azul', FlavorMode.CON_LICOR],
    ['Tussi', FlavorMode.CON_LICOR],
    ['Chicle', FlavorMode.SIN_LICOR],
    ['Fresa Bombón', FlavorMode.SIN_LICOR],
    ['Mango Biche', FlavorMode.SIN_LICOR],
    ['Miami', FlavorMode.SIN_LICOR],
  ] as const;

  for (const [name, mode] of flavors) {
    await FlavorModel.updateOne({ name, mode }, { $setOnInsert: { name, mode, active: true } }, { upsert: true });
  }

  const prices = [
    { type: PricingType.VASO, sizeOz: 12, amount: 12000, currency: 'COP', active: true },
    { type: PricingType.VASO, sizeOz: 16, amount: 15000, currency: 'COP', active: true },
    { type: PricingType.JERINGA, amount: 3000, currency: 'COP', active: true },
  ];

  for (const price of prices) {
    const filter = price.type === PricingType.VASO ? { type: price.type, sizeOz: price.sizeOz } : { type: price.type };
    await PricingModel.updateOne(filter, { $setOnInsert: price }, { upsert: true });
  }

  console.log('Seed completado.');
  await connection.disconnect();
}

void run().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
