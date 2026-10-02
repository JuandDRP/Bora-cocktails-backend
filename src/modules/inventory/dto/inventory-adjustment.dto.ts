import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

export class InventoryAdjustmentDto {
  @ApiProperty()
  @IsMongoId()
  inventoryId!: string;

  @ApiProperty({ example: -1, description: 'Delta de stock. Puede ser positiva o negativa, pero nunca deja stock negativo.' })
  @IsInt()
  quantityDelta!: number;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
