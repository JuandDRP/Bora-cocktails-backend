import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { FlavorMode } from '@/common/constants/enums';

export class QueryFlavorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FlavorMode })
  @IsOptional()
  @IsEnum(FlavorMode)
  mode?: FlavorMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  active?: string;
}
