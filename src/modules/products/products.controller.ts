import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  create(@Body() dto: CreateProductDto) { return this.productsService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  findAll(@Query() query: QueryProductDto) { return this.productsService.findAll(query); }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProductDto) { return this.productsService.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar producto' })
  @ApiParam({ name: 'id' })
  remove(@Param('id', ParseObjectIdPipe) id: string) { return this.productsService.remove(id); }
}
