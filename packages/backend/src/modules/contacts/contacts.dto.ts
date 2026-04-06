import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  IsBoolean,
  IsObject,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactType } from '@deepfinance/shared';

export class CreateContactDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Contact name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ContactType, description: 'Type of contact' })
  @IsEnum(ContactType)
  contactType: ContactType;

  @ApiPropertyOptional({ example: 'john@acme.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+44 20 1234 5678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Acme Corp Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({
    example: 'GB123456789',
    description: 'VAT number or tax ID',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxNumber?: string;

  @ApiPropertyOptional({
    example: 'CUST-001',
    description: 'Customer/supplier reference number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 30, description: 'Default payment terms in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPaymentTermsDays?: number;

  @ApiPropertyOptional({
    description: 'Billing address',
    example: {
      line1: '123 Main Street',
      line2: 'Suite 100',
      city: 'London',
      county: 'Greater London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
  })
  @IsOptional()
  @IsObject()
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  };

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 'Primary vendor for supplies' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ContactType })
  @IsOptional()
  @IsEnum(ContactType)
  contactType?: ContactType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPaymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  } | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class ContactQueryDto {
  @ApiPropertyOptional({ enum: ContactType, description: 'Filter by contact type' })
  @IsOptional()
  @IsEnum(ContactType)
  contactType?: ContactType;

  @ApiPropertyOptional({
    description: 'Search by name or email',
    example: 'acme',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
