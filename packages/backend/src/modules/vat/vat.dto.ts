import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VatScheme, VatReturnFrequency } from './vat-settings.entity';
import { VatReturnStatus } from './vat-return.entity';

// ======================================
// VAT Settings DTOs
// ======================================

export class VatSettingsDto {
  @ApiPropertyOptional({ example: 'GB123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vatNumber?: string | null;

  @ApiProperty({
    example: 'STANDARD',
    enum: VatScheme,
  })
  @IsEnum(VatScheme)
  vatScheme: VatScheme;

  @ApiPropertyOptional({ example: 14.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  flatRatePercentage?: number | null;

  @ApiPropertyOptional({ example: 'Accountancy services' })
  @IsOptional()
  @IsString()
  flatRateCategory?: string | null;

  @ApiProperty({
    example: 'QUARTERLY',
    enum: VatReturnFrequency,
  })
  @IsEnum(VatReturnFrequency)
  returnFrequency: VatReturnFrequency;

  @ApiPropertyOptional({ example: 1, description: 'Stagger group 1-3' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  staggerGroup?: number | null;

  @ApiProperty({ example: true })
  @IsBoolean()
  isRegistered: boolean;

  @ApiPropertyOptional({ example: '2020-01-01' })
  @IsOptional()
  @IsDateString()
  registrationDate?: string | null;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsDateString()
  deregistrationDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmrcClientId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmrcClientSecret?: string | null;
}

export class CreateVatSettingsDto extends VatSettingsDto {}

export class UpdateVatSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vatNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(VatScheme)
  vatScheme?: VatScheme;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  flatRatePercentage?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flatRateCategory?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(VatReturnFrequency)
  returnFrequency?: VatReturnFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  staggerGroup?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRegistered?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deregistrationDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmrcClientId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmrcClientSecret?: string | null;
}

// ======================================
// VAT Return DTOs
// ======================================

export class CalculateVatReturnDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-03-31' })
  @IsDateString()
  periodEnd: string;
}

export class VatReturnResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  periodStart: string;

  @ApiProperty()
  periodEnd: string;

  @ApiProperty()
  dueDate: string;

  @ApiProperty({ enum: VatReturnStatus })
  status: VatReturnStatus;

  @ApiProperty()
  vatSchemeUsed: string;

  @ApiProperty({ description: 'VAT due on sales (pence)' })
  box1: string;

  @ApiProperty({ description: 'VAT due on EU acquisitions (pence)' })
  box2: string;

  @ApiProperty({ description: 'Total VAT due (pence)' })
  box3: string;

  @ApiProperty({ description: 'VAT reclaimed on purchases (pence)' })
  box4: string;

  @ApiProperty({ description: 'Net VAT to pay/reclaim (pence)' })
  box5: string;

  @ApiProperty({ description: 'Total sales excluding VAT (pence)' })
  box6: string;

  @ApiProperty({ description: 'Total purchases excluding VAT (pence)' })
  box7: string;

  @ApiProperty({ description: 'Total goods supplied to EU (pence)' })
  box8: string;

  @ApiProperty({ description: 'Total goods acquired from EU (pence)' })
  box9: string;

  @ApiPropertyOptional()
  calculatedAt?: Date | null;

  @ApiPropertyOptional()
  submittedAt?: Date | null;

  @ApiPropertyOptional()
  hmrcCorrelationId?: string | null;

  @ApiPropertyOptional()
  hmrcReceiptId?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class VatReturnQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(VatReturnStatus)
  @Type(() => String)
  status?: VatReturnStatus;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  periodStartFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  periodEndTo?: string;
}

// ======================================
// VAT Obligation DTOs
// ======================================

export class VatObligationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  periodStart: string;

  @ApiProperty()
  periodEnd: string;

  @ApiProperty()
  dueDate: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  hmrcPeriodKey?: string | null;

  @ApiPropertyOptional()
  receivedDate?: string | null;

  @ApiPropertyOptional()
  vatReturnId?: string | null;
}

// ======================================
// HMRC OAuth DTOs
// ======================================

export class HmrcAuthUrlResponseDto {
  @ApiProperty({
    description: 'OAuth authorization URL to redirect user to HMRC',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
  })
  state: string;
}

export class HmrcCallbackDto {
  @ApiProperty({
    description: 'Authorization code from HMRC OAuth',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF protection',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

// ======================================
// VAT Calculation Result (Internal)
// ======================================

export interface VatCalculationResult {
  box1: bigint;
  box2: bigint;
  box3: bigint;
  box4: bigint;
  box5: bigint;
  box6: bigint;
  box7: bigint;
  box8: bigint;
  box9: bigint;
}

export interface HmrcSubmitPayload {
  periodKey: string;
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}
