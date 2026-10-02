import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { InventoryIdentityDto } from './inventory-identity.dto';

export class InventoryEntryDto extends InventoryIdentityDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 'BOLSA' })
  @IsString()
  unit!: string;

  @ApiPropertyOptional({ example: 50 })
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
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
