import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { InventoryMovementsService } from './inventory-movements.service';
import { QueryInventoryMovementDto } from './dto/query-inventory-movement.dto';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';

@ApiTags('inventory-movements')
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(private readonly service: InventoryMovementsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar movimientos de inventario' })
  findAll(@Query() query: QueryInventoryMovementDto) { return this.service.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar movimiento por ID' })
  @ApiParam({ name: 'id' })
  findById(@Param('id', ParseObjectIdPipe) id: string) { return this.service.findById(id); }
}
