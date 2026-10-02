import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Post()
  @ApiOperation({ summary: 'Crear precio' })
  create(@Body() dto: CreatePricingDto) { return this.service.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Listar precios' })
  findAll() { return this.service.findAll(); }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar precio' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdatePricingDto) { return this.service.update(id, dto); }
}
