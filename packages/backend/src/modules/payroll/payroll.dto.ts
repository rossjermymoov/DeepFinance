import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
  Max,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Employee,
  EmployeeTitle,
  EmployeeGender,
  PayFrequency,
  PayMethod,
  NiCategory,
  StudentLoanPlan,
} from './employee.entity';
import { PayRunStatus } from './pay-run.entity';

// ======================================
// Employee DTOs
// ======================================

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @MaxLength(50)
  employeeNumber: string;

  @ApiPropertyOptional({ example: 'MR', enum: EmployeeTitle })
  @IsOptional()
  @IsEnum(EmployeeTitle)
  title?: EmployeeTitle;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({ example: 'Andrew' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'MALE', enum: EmployeeGender })
  @IsEnum(EmployeeGender)
  gender: EmployeeGender;

  @ApiPropertyOptional({ example: 'AA 12 34 56 C' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  niNumber?: string;

  @ApiProperty({ example: '1257L' })
  @IsString()
  @MaxLength(10)
  taxCode: string;

  @ApiPropertyOptional({ example: 'A', enum: NiCategory })
  @IsOptional()
  @IsEnum(NiCategory)
  niCategory?: NiCategory;

  @ApiProperty({ example: 'MONTHLY', enum: PayFrequency })
  @IsEnum(PayFrequency)
  payFrequency: PayFrequency;

  @ApiProperty({ example: 250000, description: 'Basic pay rate in pence' })
  @IsNumber()
  @Min(0)
  basicPayRate: number;

  @ApiProperty({ example: 'SALARY', enum: PayMethod })
  @IsEnum(PayMethod)
  payMethod: PayMethod;

  @ApiPropertyOptional({ example: '20-12-34' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankSortCode?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'J Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  leaveDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDirector?: boolean;

  @ApiPropertyOptional({
    example: 'NONE',
    enum: StudentLoanPlan,
    default: StudentLoanPlan.NONE,
  })
  @IsOptional()
  @IsEnum(StudentLoanPlan)
  studentLoanPlan?: StudentLoanPlan;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  pensionOptOut?: boolean;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pensionContributionPct?: number;

  @ApiPropertyOptional({ example: 3.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  employerPensionPct?: number;

  @ApiProperty({ example: '10 High Street' })
  @IsString()
  @MaxLength(100)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Flat 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressLine2?: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  @MaxLength(50)
  city: string;

  @ApiPropertyOptional({ example: 'Greater London' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  county?: string;

  @ApiProperty({ example: 'SW1A 1AA' })
  @IsString()
  @MaxLength(10)
  postcode: string;

  @ApiPropertyOptional({ example: 'john.smith@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: '07700900000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;

  @ApiPropertyOptional({ enum: EmployeeTitle })
  @IsOptional()
  @IsEnum(EmployeeTitle)
  title?: EmployeeTitle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: EmployeeGender })
  @IsOptional()
  @IsEnum(EmployeeGender)
  gender?: EmployeeGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  niNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  taxCode?: string;

  @ApiPropertyOptional({ enum: NiCategory })
  @IsOptional()
  @IsEnum(NiCategory)
  niCategory?: NiCategory;

  @ApiPropertyOptional({ enum: PayFrequency })
  @IsOptional()
  @IsEnum(PayFrequency)
  payFrequency?: PayFrequency;

  @ApiPropertyOptional({ description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basicPayRate?: number;

  @ApiPropertyOptional({ enum: PayMethod })
  @IsOptional()
  @IsEnum(PayMethod)
  payMethod?: PayMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankSortCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  leaveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDirector?: boolean;

  @ApiPropertyOptional({ enum: StudentLoanPlan })
  @IsOptional()
  @IsEnum(StudentLoanPlan)
  studentLoanPlan?: StudentLoanPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pensionOptOut?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pensionContributionPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  employerPensionPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  county?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ======================================
// Pay Run DTOs
// ======================================

export class CreatePayRunDto {
  @ApiProperty({ example: 'MONTHLY', enum: PayFrequency })
  @IsEnum(PayFrequency)
  payFrequency: PayFrequency;

  @ApiProperty({ example: 1, description: 'Tax period (week or month number)' })
  @IsNumber()
  @Min(1)
  @Max(53)
  taxPeriod: number;

  @ApiPropertyOptional({ example: '2025-26' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  taxYear?: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2025-01-31' })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({ example: '2025-02-01' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ example: 'Initial pay run for January' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayslipAdditionsDto {
  @ApiPropertyOptional({ example: 500, description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtime?: number;

  @ApiPropertyOptional({ example: 10000, description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiPropertyOptional({ example: 5000, description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @ApiPropertyOptional({ example: 1000, description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAdditions?: number;

  @ApiPropertyOptional({ example: 500, description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherDeductions?: number;
}

// ======================================
// Payroll Settings DTOs
// ======================================

export class PayrollSettingsDto {
  @ApiPropertyOptional({ example: '123/AB12345' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employerPayeRef?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountsOfficeRef?: string;

  @ApiPropertyOptional({ example: 'Example Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  employerName?: string;

  @ApiPropertyOptional({ example: '2025-26' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  taxYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmrcClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmrcClientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smallEmployerRelief?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  employmentAllowanceClaimable?: boolean;

  @ApiPropertyOptional({ example: 300000, description: 'In pence' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employmentAllowanceClaimed?: number;
}

// ======================================
// HMRC Auth DTOs
// ======================================

export class HmrcAuthUrlResponseDto {
  @ApiProperty()
  authUrl: string;

  @ApiProperty()
  state: string;
}

export class HmrcCallbackDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  state: string;
}

export class HmrcCallbackResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  accessToken?: string;
}

// ======================================
// Dashboard/Summary DTOs
// ======================================

export class PayrollSummaryDto {
  @ApiProperty()
  totalEmployees: number;

  @ApiProperty()
  activeEmployees: number;

  @ApiProperty({ description: 'In pence' })
  totalYearToDateGross: number;

  @ApiProperty({ description: 'In pence' })
  totalYearToDateTax: number;

  @ApiProperty({ description: 'In pence' })
  totalYearToDateNiEmployee: number;

  @ApiProperty({ description: 'In pence' })
  totalYearToDateNiEmployer: number;

  @ApiProperty()
  pendingPayRuns: number;

  @ApiProperty()
  submittedPayRuns: number;

  @ApiProperty()
  lastSubmissionDate?: Date;
}
