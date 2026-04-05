import { ReconciliationStatus, PaymentMethod } from './enums';

/** A bank or cash account */
export interface BankAccount {
  id: string;
  tenantId: string;
  entityId: string;
  accountId: string;               // Linked chart of accounts entry
  bankName: string;
  accountName: string;
  sortCode?: string;
  accountNumber?: string;
  iban?: string;
  bic?: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  openBankingConnectionId?: string;
  lastFeedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** An individual bank transaction (from feed or manual) */
export interface BankTransaction {
  id: string;
  tenantId: string;
  entityId: string;
  bankAccountId: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;                  // Positive = money in, negative = money out
  balance?: number;                // Running balance if available from feed
  status: ReconciliationStatus;
  matchedJournalId?: string;       // Reconciled against this journal
  matchedPaymentId?: string;
  bankTransactionId?: string;      // External ID from bank feed
  importBatchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A payment (made or received) */
export interface Payment {
  id: string;
  tenantId: string;
  entityId: string;
  contactId: string;
  bankAccountId: string;
  date: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  method: PaymentMethod;
  reference?: string;
  description?: string;
  isIncoming: boolean;             // true = receipt, false = payment
  journalId?: string;
  bankTransactionId?: string;
  allocations: PaymentAllocation[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/** Links a payment to the invoices/bills it settles */
export interface PaymentAllocation {
  id: string;
  paymentId: string;
  documentType: 'INVOICE' | 'BILL' | 'CREDIT_NOTE';
  documentId: string;
  amount: number;
}

export interface CreatePaymentDto {
  contactId: string;
  bankAccountId: string;
  date: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  reference?: string;
  isIncoming: boolean;
  allocations: { documentType: 'INVOICE' | 'BILL'; documentId: string; amount: number }[];
}
