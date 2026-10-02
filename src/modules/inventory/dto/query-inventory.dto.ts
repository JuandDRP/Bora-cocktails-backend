import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { FlavorMode, InventoryStatus } from '@/common/constants/enums';

export class QueryInventoryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presentation?: string;
}
