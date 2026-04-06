import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillStatus } from '@deepfinance/shared';

export class CreateBillLineDto {
  @ApiProperty({ description: 'Line description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Expense account ID' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ example: 10, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Tax rate ID if applicable' })
  @IsOptional()
  @IsUUID()
  taxRateId?: string;
}

export class CreateBillDto {
  @ApiProperty({ description: 'Supplier contact ID' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ example: '2026-04-06' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ example: '2026-05-06' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'GBP', default: 'GBP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({
    type: [CreateBillLineDto],
    description: 'Bill line items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillLineDto)
  lines: CreateBillLineDto[];
}

export class UpdateBillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({
    type: [CreateBillLineDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillLineDto)
  lines?: CreateBillLineDto[];
}

export class RecordPaymentDto {
  @ApiProperty({ example: 500.00, description: 'Amount paid' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: '2026-04-06' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class BillQueryDto {
  @ApiPropertyOptional({ enum: BillStatus })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiPropertyOptional({ description: 'Filter by supplier' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
