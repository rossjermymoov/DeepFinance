import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTaxRateDto {
  @ApiProperty({ example: 'Standard Rate', description: 'Tax rate name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'SR', description: 'Unique code for this rate' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 20.00, description: 'Tax rate percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ example: 'Standard VAT rate' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this the default rate for this entity?' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ example: '2026-01-01', description: 'Date this rate becomes effective' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Date this rate expires (null = still active)' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class UpdateTaxRateDto {
  @ApiPropertyOptional({ example: 'Standard Rate' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 20.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string | null;
}

export class TaxRateQueryDto {
  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
