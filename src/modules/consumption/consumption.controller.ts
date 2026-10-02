import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IdempotencyKeyRequiredException } from '@/common/exceptions/domain.exceptions';
import { ConsumptionService } from './consumption.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { QueryConsumptionDto } from './dto/query-consumption.dto';

@ApiTags('consumption')
@Controller('consumption')
export class ConsumptionController {
  constructor(private readonly service: ConsumptionService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar consumo diario y descontar inventario' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  create(@Headers('idempotency-key') key: string | undefined, @Body() dto: CreateConsumptionDto) {
    if (!key) throw new IdempotencyKeyRequiredException();
    return this.service.create(dto, key);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar consumos' })
  findAll(@Query() query: QueryConsumptionDto) { return this.service.findAll(query); }

  @Get('date/:date')
  @ApiOperation({ summary: 'Consultar consumo de una fecha' })
  @ApiParam({ name: 'date', example: '2026-10-01' })
  findByDate(@Param('date') date: string) { return this.service.findByDate(date); }
}
