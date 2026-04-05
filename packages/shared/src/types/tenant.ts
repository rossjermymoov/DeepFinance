/** A tenant represents a single Deep-Stack subscription / organisation */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  defaultCurrency: string;
  defaultTaxJurisdiction: string;
  financialYearStartMonth: number;  // 1-12
  dateFormat: string;               // e.g., 'DD/MM/YYYY'
  numberFormat: string;             // e.g., '1,234.56'
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  settings?: Partial<TenantSettings>;
}
