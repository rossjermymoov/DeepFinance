import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  MaxLength,
  IsEnum,
  Min,
  IsPositive,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBankTransactionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Bank account ID' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ example: '2026-04-01', description: 'Transaction date' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ example: 'Supplier payment', description: 'Transaction description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({ example: 1500.50, description: 'Amount (positive for in, negative for out)' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'CREDIT', enum: ['CREDIT', 'DEBIT'] })
  @IsEnum(['CREDIT', 'DEBIT'])
  type: string;
}

export class BankTransactionBatchDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsDateString()
  transactionDate: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsNumber()
  amount: number;

  @IsEnum(['CREDIT', 'DEBIT'])
  type: string;
}

export class ImportBankTransactionsDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({
    type: [BankTransactionBatchDto],
    description: 'Array of transactions to import',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankTransactionBatchDto)
  transactions: BankTransactionBatchDto[];

  @ApiPropertyOptional({ example: 'CSV', description: 'Source format (e.g., CSV, OFX)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  importSource?: string;
}

export class ReconcileTransactionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Journal ID to match' })
  @IsUUID()
  matchedJournalId: string;
}

export class BankTransactionQueryDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ example: 'UNRECONCILED', enum: ['UNRECONCILED', 'MATCHED', 'RECONCILED', 'EXCLUDED'] })
  @IsOptional()
  @IsString()
  reconciliationStatus?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class BankReconciliationSummaryDto {
  @ApiProperty({ example: 25, description: 'Count of unreconciled transactions' })
  unreconciled: number;

  @ApiProperty({ example: 10, description: 'Count of matched transactions' })
  matched: number;

  @ApiProperty({ example: 100, description: 'Count of reconciled transactions' })
  reconciled: number;

  @ApiProperty({ example: 5, description: 'Count of excluded transactions' })
  excluded: number;

  @ApiProperty({ example: 12500.75, description: 'Total unreconciled amount' })
  unreconcilledAmount: number;

  @ApiProperty({ example: 50000.00, description: 'Total of all transactions' })
  totalAmount: number;
}
