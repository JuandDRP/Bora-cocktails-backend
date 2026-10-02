import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { FlavorMode, InventoryMovementType } from '@/common/constants/enums';

export class QueryInventoryMovementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  inventoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  flavorId?: string;

  @ApiPropertyOptional({ enum: InventoryMovementType })
  @IsOptional()
  @IsEnum(InventoryMovementType)
  movementType?: InventoryMovementType;

  @ApiPropertyOptional({ enum: FlavorMode })
  @IsOptional()
  @IsEnum(FlavorMode)
  mode?: FlavorMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
