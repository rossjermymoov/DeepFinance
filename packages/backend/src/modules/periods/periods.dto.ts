import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePeriodsDto {
  @ApiProperty({ example: 1, description: 'Month to start (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth: number;

  @ApiProperty({ example: 2026, description: 'Year to start' })
  @IsNumber()
  startYear: number;
}

export class RecordPaymentDto {
  @ApiProperty({ example: 1000.50, description: 'Amount paid' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: '2026-04-06' })
  @IsOptional()
  date?: string;
}
