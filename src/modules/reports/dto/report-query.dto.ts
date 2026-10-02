import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsInt, IsString } from 'class-validator';
import { FlavorMode, InventoryStatus, SaleComplexity } from '@/common/constants/enums';

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  flavorId?: string;

  @ApiPropertyOptional({ enum: FlavorMode })
  @IsOptional()
  @IsEnum(FlavorMode)
  mode?: FlavorMode;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional()
  @IsInt()
  sizeOz?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presentation?: string;

  @ApiPropertyOptional({ enum: SaleComplexity })
  @IsOptional()
  @IsEnum(SaleComplexity)
  complexity?: SaleComplexity;
}
