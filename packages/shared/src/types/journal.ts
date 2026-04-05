import {
  JournalStatus,
  JournalType,
  JournalSourceType,
  DimensionType,
} from './enums';

/** A complete double-entry journal transaction */
export interface Journal {
  id: string;
  tenantId: string;
  entityId: string;
  journalNumber: string;           // Sequential per entity, e.g., 'JNL-000001'
  date: string;                    // ISO date (YYYY-MM-DD)
  periodId: string;                // Financial period this posts to
  type: JournalType;
  status: JournalStatus;
  description: string;
  reference?: string;              // External reference
  sourceType: JournalSourceType;
  sourceId?: string;               // ID of the source document
  currency: string;
  exchangeRate?: number;           // If different from entity base currency
  lines: JournalLine[];
  totalDebit: number;              // Must equal totalCredit
  totalCredit: number;
  isReversed: boolean;
  reversedByJournalId?: string;
  reversesJournalId?: string;
  postedAt?: Date;
  postedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/** A single debit or credit line within a journal */
export interface JournalLine {
  id: string;
  journalId: string;
  lineNumber: number;
  accountId: string;
  description?: string;
  debit: number;                   // One of debit/credit must be 0
  credit: number;
  currency: string;
  exchangeRate?: number;
  baseCurrencyDebit: number;       // Converted to entity base currency
  baseCurrencyCredit: number;
  taxRateId?: string;
  taxAmount?: number;
  dimensions: JournalLineDimension[];
  customFields?: Record<string, unknown>;  // DEEP module metadata
}

/** Dimension tag on a journal line */
export interface JournalLineDimension {
  dimensionType: DimensionType;
  dimensionId: string;
  dimensionName?: string;          // Denormalised for display
}

/** DTO for creating a journal */
export interface CreateJournalDto {
  date: string;
  type?: JournalType;
  description: string;
  reference?: string;
  currency?: string;
  exchangeRate?: number;
  lines: CreateJournalLineDto[];
}

export interface CreateJournalLineDto {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  taxRateId?: string;
  dimensions?: JournalLineDimension[];
}
