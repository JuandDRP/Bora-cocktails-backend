import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { InventoryIdentityDto } from './inventory-identity.dto';

export class CreateInventoryDto extends InventoryIdentityDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({ example: 'BOLSA' })
  @IsString()
  unit!: string;

  @ApiPropertyOptional({ example: 50, description: 'Equivalencia en unidades base por cada registro de existencia.' })
  @IsOptional()
  @IsPositive()
  equivalentUnitsPerItem?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
