import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IdempotencyKeyRequiredException } from '@/common/exceptions/domain.exceptions';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar venta' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  create(@Headers('idempotency-key') key: string | undefined, @Body() dto: CreateSaleDto) {
    if (!key) throw new IdempotencyKeyRequiredException();
    return this.service.create(dto, key);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar ventas' })
  findAll(@Query() query: QuerySalesDto) { return this.service.findAll(query); }

  @Get('date/:date')
  @ApiOperation({ summary: 'Consultar ventas por fecha' })
  @ApiParam({ name: 'date', example: '2026-10-01' })
  findByDate(@Param('date') date: string) { return this.service.findByDate(date); }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar venta por ID' })
  @ApiParam({ name: 'id' })
  findById(@Param('id', ParseObjectIdPipe) id: string) { return this.service.findById(id); }
}
