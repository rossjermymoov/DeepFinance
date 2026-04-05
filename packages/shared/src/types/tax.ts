import { TaxReturnStatus, TaxJurisdiction } from './enums';

/** A tax rate definition */
export interface TaxRate {
  id: string;
  tenantId: string;
  entityId: string;
  name: string;                    // e.g., 'Standard Rate', 'Reduced Rate', 'Zero Rate'
  rate: number;                    // Percentage, e.g., 20 for 20%
  jurisdiction: TaxJurisdiction;
  isDefault: boolean;
  isActive: boolean;
  // HMRC MTD box mapping
  vatBoxNumber?: number;           // Which box on the VAT return (1-9)
  isReverseCharge: boolean;
  isExempt: boolean;
  isZeroRated: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A VAT/tax return */
export interface TaxReturn {
  id: string;
  tenantId: string;
  entityId: string;
  jurisdiction: TaxJurisdiction;
  periodStart: string;
  periodEnd: string;
  status: TaxReturnStatus;
  // HMRC MTD VAT return boxes
  box1?: number;                   // VAT due on sales
  box2?: number;                   // VAT due on acquisitions
  box3?: number;                   // Total VAT due (box1 + box2)
  box4?: number;                   // VAT reclaimed on purchases
  box5?: number;                   // Net VAT (box3 - box4)
  box6?: number;                   // Total sales excluding VAT
  box7?: number;                   // Total purchases excluding VAT
  box8?: number;                   // Total supplies ex-VAT to EC
  box9?: number;                   // Total acquisitions ex-VAT from EC
  submittedAt?: Date;
  submittedBy?: string;
  hmrcReceiptId?: string;          // HMRC acknowledgement
  createdAt: Date;
  updatedAt: Date;
}

/** Financial period */
export interface FinancialPeriod {
  id: string;
  tenantId: string;
  entityId: string;
  name: string;                    // e.g., 'April 2026', 'Q1 2026/27'
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  financialYearId: string;
  closedAt?: Date;
  closedBy?: string;
  createdAt: Date;
}

/** Financial year */
export interface FinancialYear {
  id: string;
  tenantId: string;
  entityId: string;
  name: string;                    // e.g., '2026/27'
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  periods: FinancialPeriod[];
  createdAt: Date;
}

/** UK VAT rate templates */
export const UK_VAT_RATES = {
  STANDARD: { name: 'Standard Rate (20%)', rate: 20, vatBoxNumber: 1 },
  REDUCED: { name: 'Reduced Rate (5%)', rate: 5, vatBoxNumber: 1 },
  ZERO: { name: 'Zero Rated (0%)', rate: 0, vatBoxNumber: 6, isZeroRated: true },
  EXEMPT: { name: 'Exempt', rate: 0, isExempt: true },
  NO_VAT: { name: 'No VAT', rate: 0 },
  REVERSE_CHARGE: { name: 'Reverse Charge (20%)', rate: 20, isReverseCharge: true },
} as const;
