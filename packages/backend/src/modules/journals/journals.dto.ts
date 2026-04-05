import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
  MaxLength,
  Min,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JournalType } from '@deepfinance/shared';

export class CreateJournalLineDto {
  @ApiProperty({ description: 'Account ID to debit or credit' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Line description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Debit amount (0 if this line is a credit)', example: 1000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'Credit amount (0 if this line is a debit)', example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit: number;

  @ApiPropertyOptional({ description: 'Tax rate ID for this line' })
  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @ApiPropertyOptional({ description: 'Dimension tags: { "DEPARTMENT": "uuid", "PROJECT": "uuid" }' })
  @IsOptional()
  @IsObject()
  dimensions?: Record<string, string>;
}

export class CreateJournalDto {
  @ApiProperty({ description: 'Journal date (YYYY-MM-DD)', example: '2026-04-05' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: JournalType, default: JournalType.STANDARD })
  @IsOptional()
  @IsEnum(JournalType)
  type?: JournalType;

  @ApiProperty({ description: 'Journal description', example: 'Office rent April 2026' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ description: 'External reference', example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Transaction currency (defaults to entity base currency)', example: 'GBP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange rate if foreign currency' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  exchangeRate?: number;

  @ApiProperty({ description: 'Journal lines (minimum 2)', type: [CreateJournalLineDto] })
  @IsArray()
  @ArrayMinSize(2, { message: 'A journal must have at least 2 lines' })
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}

export class PostJournalDto {
  @ApiPropertyOptional({ description: 'Override posting date (defaults to journal date)' })
  @IsOptional()
  @IsDateString()
  postingDate?: string;
}

export class ReverseJournalDto {
  @ApiProperty({ description: 'Date for the reversing journal', example: '2026-04-30' })
  @IsDateString()
  reversalDate: string;

  @ApiPropertyOptional({ description: 'Reason for reversal' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class JournalQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status (DRAFT, POSTED, REVERSED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by type' })
  @IsOptional()
  @IsEnum(JournalType)
  type?: JournalType;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
