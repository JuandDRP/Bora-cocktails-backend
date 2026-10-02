import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IdempotencyKeyRequiredException } from '@/common/exceptions/domain.exceptions';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryEntryDto } from './dto/inventory-entry.dto';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una existencia inicial y registrar ENTRADA' })
  create(@Body() dto: CreateInventoryDto) { return this.service.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Consultar inventario' })
  findAll(@Query() query: QueryInventoryDto) { return this.service.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar existencia por ID' })
  @ApiParam({ name: 'id' })
  findById(@Param('id', ParseObjectIdPipe) id: string) { return this.service.findById(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos auxiliares de una existencia' })
  @ApiParam({ name: 'id' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateInventoryDto) { return this.service.update(id, dto); }

  @Post('entries')
  @ApiOperation({ summary: 'Registrar entrada de inventario' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  registerEntry(@Headers('idempotency-key') key: string | undefined, @Body() dto: InventoryEntryDto) {
    if (!key) throw new IdempotencyKeyRequiredException();
    return this.service.registerEntry(dto, key);
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Registrar ajuste de inventario' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  registerAdjustment(@Headers('idempotency-key') key: string | undefined, @Body() dto: InventoryAdjustmentDto) {
    if (!key) throw new IdempotencyKeyRequiredException();
    return this.service.registerAdjustment(dto, key);
  }
}
