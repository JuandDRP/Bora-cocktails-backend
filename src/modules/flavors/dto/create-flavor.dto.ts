import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FlavorMode } from '@/common/constants/enums';

export class CreateFlavorDto {
  @ApiProperty({ example: 'Mora azul' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: FlavorMode })
  @IsEnum(FlavorMode)
  mode!: FlavorMode;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
