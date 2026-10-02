import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Flavor, FlavorSchema } from './schemas/flavor.schema';
import { FlavorsController } from './flavors.controller';
import { FlavorsService } from './flavors.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Flavor.name, schema: FlavorSchema }])],
  controllers: [FlavorsController],
  providers: [FlavorsService],
  exports: [FlavorsService],
})
export class FlavorsModule {}
