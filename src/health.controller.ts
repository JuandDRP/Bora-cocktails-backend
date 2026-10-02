import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Estado de la API' })
  getHealth() {
    return {
      status: 'ok',
      service: 'bora-cocktails-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
