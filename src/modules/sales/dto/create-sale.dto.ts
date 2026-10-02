import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { FlavorMode, PaymentMethod, SaleDetailType } from '@/common/constants/enums';

export class SaleFlavorInputDto {
  @ApiProperty()
  @IsMongoId()
  flavorId!: string;
}

export class SaleDetailInputDto {
  @ApiProperty({ enum: SaleDetailType })
  @IsEnum(SaleDetailType)
  type!: SaleDetailType;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  sizeOz?: number;

  @ApiPropertyOptional({ enum: FlavorMode })
  @IsOptional()
  @IsEnum(FlavorMode)
  mode?: FlavorMode;

  @ApiPropertyOptional({ type: [SaleFlavorInputDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SaleFlavorInputDto)
  flavors?: SaleFlavorInputDto[];

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [SaleDetailInputDto] })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleDetailInputDto)
  details!: SaleDetailInputDto[];

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '2026-10-01T19:35:00.000Z' })
  @IsDateString()
  saleDate!: string;
}
