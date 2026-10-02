import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Reporte de ventas' })
  sales(@Query() query: ReportQueryDto) { return this.service.sales(query); }

  @Get('inventory')
  @ApiOperation({ summary: 'Reporte de inventario' })
  inventory(@Query() query: ReportQueryDto) { return this.service.inventory(query); }

  @Get('consumption')
  @ApiOperation({ summary: 'Reporte de consumo' })
  consumption(@Query() query: ReportQueryDto) { return this.service.consumption(query); }

  @Get('products')
  @ApiOperation({ summary: 'Reporte de productos' })
  products(@Query() query: ReportQueryDto) { return this.service.products(query); }

  @Get('flavors')
  @ApiOperation({ summary: 'Reporte de sabores' })
  flavors(@Query() query: ReportQueryDto) { return this.service.flavors(query); }
}
