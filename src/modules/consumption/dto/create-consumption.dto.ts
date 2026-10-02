import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, IsPositive, IsString } from 'class-validator';
import { FlavorMode } from '@/common/constants/enums';

export class CreateConsumptionDto {
  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  consumptionDate!: string;

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

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 'BOLSA' })
  @IsString()
  unit!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
