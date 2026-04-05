import { EntityType, TaxJurisdiction } from './enums';

/** A legal entity / company within a tenant */
export interface Entity {
  id: string;
  tenantId: string;
  name: string;
  legalName: string;
  entityType: EntityType;
  baseCurrency: string;
  taxJurisdiction: TaxJurisdiction;
  companyNumber?: string;
  vatNumber?: string;
  charityNumber?: string;
  registeredAddress?: Address;
  isActive: boolean;
  settings: EntitySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface EntitySettings {
  vatScheme?: string;
  vatPeriodMonths?: number;       // 1, 3, or 12
  chartOfAccountsTemplate?: string;
  defaultPaymentTermsDays: number;
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  billPrefix?: string;
}

export interface CreateEntityDto {
  name: string;
  legalName: string;
  entityType: EntityType;
  baseCurrency: string;
  taxJurisdiction: TaxJurisdiction;
  companyNumber?: string;
  vatNumber?: string;
  charityNumber?: string;
  registeredAddress?: Address;
  settings?: Partial<EntitySettings>;
}
