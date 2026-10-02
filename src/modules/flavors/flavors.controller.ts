import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FlavorsService } from './flavors.service';
import { CreateFlavorDto } from './dto/create-flavor.dto';
import { UpdateFlavorDto } from './dto/update-flavor.dto';
import { QueryFlavorDto } from './dto/query-flavor.dto';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';

@ApiTags('flavors')
@Controller('flavors')
export class FlavorsController {
  constructor(private readonly flavorsService: FlavorsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear sabor' })
  create(@Body() dto: CreateFlavorDto) { return this.flavorsService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Listar sabores' })
  findAll(@Query() query: QueryFlavorDto) { return this.flavorsService.findAll(query); }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar sabor' })
  @ApiParam({ name: 'id' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateFlavorDto) { return this.flavorsService.update(id, dto); }
}
