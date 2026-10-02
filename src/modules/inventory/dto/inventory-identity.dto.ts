import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsMongoId } from 'class-validator';
import { FlavorMode } from '@/common/constants/enums';

export class InventoryIdentityDto {
  @ApiProperty()
  @IsMongoId()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  flavorId?: string;

  @ApiPropertyOptional({ enum: FlavorMode })
  @IsOptional()
  @IsEnum(FlavorMode)
  mode?: FlavorMode;

  @ApiProperty({ example: 'BOLSA' })
  @IsString()
  presentation!: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsPositive()
  capacity?: number;

  @ApiPropertyOptional({ example: 'L' })
  @IsOptional()
  @IsString()
  capacityUnit?: string;
}
