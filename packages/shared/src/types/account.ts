import { AccountType, AccountSubType } from './enums';

/** A single account in the chart of accounts */
export interface Account {
  id: string;
  tenantId: string;
  entityId: string;
  code: string;                    // e.g., '1001', '4000'
  name: string;
  description?: string;
  accountType: AccountType;
  accountSubType: AccountSubType;
  parentAccountId?: string;        // For hierarchical chart
  taxRateId?: string;              // Default tax rate
  currency?: string;               // If different from entity base currency
  isSystemAccount: boolean;        // Cannot be deleted (e.g., Retained Earnings)
  isActive: boolean;
  isLocked: boolean;               // No new transactions
  isBankAccount: boolean;
  sortOrder: number;
  customFields?: Record<string, unknown>;  // DEEP module extension fields
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountDto {
  code: string;
  name: string;
  description?: string;
  accountType: AccountType;
  accountSubType: AccountSubType;
  parentAccountId?: string;
  taxRateId?: string;
  currency?: string;
  isBankAccount?: boolean;
}

export interface UpdateAccountDto {
  name?: string;
  description?: string;
  taxRateId?: string;
  isActive?: boolean;
  isLocked?: boolean;
  customFields?: Record<string, unknown>;
}

/** Account balance at a point in time */
export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
  balance: number;                 // Net balance (debit positive for assets/expenses)
  currency: string;
}
