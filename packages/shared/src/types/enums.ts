// ============================================================
// DeepFinance Core Enums
// ============================================================

/** Account types in the chart of accounts */
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

/** Sub-types for more granular classification */
export enum AccountSubType {
  // Assets
  CURRENT_ASSET = 'CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  BANK = 'BANK',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  PREPAYMENT = 'PREPAYMENT',
  INVENTORY = 'INVENTORY',
  // Liabilities
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  VAT_LIABILITY = 'VAT_LIABILITY',
  ACCRUAL = 'ACCRUAL',
  // Equity
  SHARE_CAPITAL = 'SHARE_CAPITAL',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  RESERVES = 'RESERVES',
  // Income
  REVENUE = 'REVENUE',
  OTHER_INCOME = 'OTHER_INCOME',
  // Expenses
  DIRECT_COST = 'DIRECT_COST',
  OVERHEAD = 'OVERHEAD',
  DEPRECIATION = 'DEPRECIATION',
  TAX_EXPENSE = 'TAX_EXPENSE',
}

/** Journal entry status */
export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  AMENDED = 'AMENDED',       // Admin-corrected — original is superseded (red)
}

/** Journal types */
export enum JournalType {
  STANDARD = 'STANDARD',
  RECURRING = 'RECURRING',
  REVERSING = 'REVERSING',
  ADJUSTMENT = 'ADJUSTMENT',
  AMENDMENT = 'AMENDMENT',     // Admin correction replacing an amended journal
  SYSTEM = 'SYSTEM',           // Auto-generated (e.g., from invoice posting)
  INTERCOMPANY = 'INTERCOMPANY',
  YEAR_END = 'YEAR_END',
}

/** Source document types that generate journals */
export enum JournalSourceType {
  MANUAL = 'MANUAL',
  INVOICE = 'INVOICE',
  BILL = 'BILL',
  PAYMENT = 'PAYMENT',
  BANK_TRANSACTION = 'BANK_TRANSACTION',
  EXPENSE_CLAIM = 'EXPENSE_CLAIM',
  DEPRECIATION = 'DEPRECIATION',
  PAYROLL = 'PAYROLL',
  VAT_ADJUSTMENT = 'VAT_ADJUSTMENT',
  REVALUATION = 'REVALUATION',
  YEAR_END = 'YEAR_END',
}

/** Invoice status */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

/** Bill status */
export enum BillStatus {
  DRAFT = 'DRAFT',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  APPROVED = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

/** Contact type */
export enum ContactType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  BOTH = 'BOTH',
}

/** Payment method */
export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  BACS = 'BACS',
  FASTER_PAYMENT = 'FASTER_PAYMENT',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  STANDING_ORDER = 'STANDING_ORDER',
  CARD = 'CARD',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

/** Bank transaction reconciliation status */
export enum ReconciliationStatus {
  UNRECONCILED = 'UNRECONCILED',
  MATCHED = 'MATCHED',
  RECONCILED = 'RECONCILED',
  EXCLUDED = 'EXCLUDED',
}

/** VAT scheme types */
export enum VatScheme {
  STANDARD = 'STANDARD',
  CASH = 'CASH',
  FLAT_RATE = 'FLAT_RATE',
  ANNUAL = 'ANNUAL',
}

/** Financial period status */
export enum PeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LOCKED = 'LOCKED',
}

/** Tax return status */
export enum TaxReturnStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

/** Dimension types */
export enum DimensionType {
  DEPARTMENT = 'DEPARTMENT',
  COST_CENTRE = 'COST_CENTRE',
  PROJECT = 'PROJECT',
  LOCATION = 'LOCATION',
  CUSTOM_1 = 'CUSTOM_1',
  CUSTOM_2 = 'CUSTOM_2',
  CUSTOM_3 = 'CUSTOM_3',
  CUSTOM_4 = 'CUSTOM_4',
  CUSTOM_5 = 'CUSTOM_5',
}

/** Currency codes (ISO 4217) - commonly used */
export enum CurrencyCode {
  GBP = 'GBP',
  EUR = 'EUR',
  USD = 'USD',
  CHF = 'CHF',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  SEK = 'SEK',
  NOK = 'NOK',
  DKK = 'DKK',
  PLN = 'PLN',
  CZK = 'CZK',
  HUF = 'HUF',
  RON = 'RON',
  BGN = 'BGN',
  HRK = 'HRK',
}

/** Depreciation method */
export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  REDUCING_BALANCE = 'REDUCING_BALANCE',
  UNITS_OF_PRODUCTION = 'UNITS_OF_PRODUCTION',
}

/** Entity type (legal structure) */
export enum EntityType {
  LIMITED_COMPANY = 'LIMITED_COMPANY',
  SOLE_TRADER = 'SOLE_TRADER',
  PARTNERSHIP = 'PARTNERSHIP',
  LLP = 'LLP',
  CIO = 'CIO',               // Charitable Incorporated Organisation
  CIC = 'CIC',               // Community Interest Company
  UNINCORPORATED_CHARITY = 'UNINCORPORATED_CHARITY',
  OTHER = 'OTHER',
}

/** Tax jurisdiction */
export enum TaxJurisdiction {
  GB = 'GB',
  // EU jurisdictions ready for Stage 2
  FR = 'FR',
  DE = 'DE',
  ES = 'ES',
  IT = 'IT',
  NL = 'NL',
  IE = 'IE',
  BE = 'BE',
  PT = 'PT',
  AT = 'AT',
  SE = 'SE',
  DK = 'DK',
  FI = 'FI',
  PL = 'PL',
  CZ = 'CZ',
}
