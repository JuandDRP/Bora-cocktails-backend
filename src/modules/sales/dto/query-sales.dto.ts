import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, IsString } from 'class-validator';
import { FlavorMode, PaymentMethod, SaleComplexity, SaleDetailType } from '@/common/constants/enums';

export class QuerySalesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: SaleDetailType })
  @IsOptional()
  @IsEnum(SaleDetailType)
  type?: SaleDetailType;

  @ApiPropertyOptional({ enum: FlavorMode })
  @IsOptional()
  @IsEnum(FlavorMode)
  mode?: FlavorMode;

  @ApiPropertyOptional({ enum: SaleComplexity })
  @IsOptional()
  @IsEnum(SaleComplexity)
  complexity?: SaleComplexity;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  flavorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sizeOz?: number;
}
