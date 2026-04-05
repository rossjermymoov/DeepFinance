import { InvoiceStatus, BillStatus } from './enums';

/** Sales invoice */
export interface Invoice {
  id: string;
  tenantId: string;
  entityId: string;
  contactId: string;
  invoiceNumber: string;
  reference?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  exchangeRate?: number;
  lines: InvoiceLine[];
  subtotal: number;
  totalTax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  journalId?: string;             // GL journal created on posting
  sentAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InvoiceLine {
  id: string;
  lineNumber: number;
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;                  // quantity * unitPrice
  taxRateId?: string;
  taxAmount: number;
  lineTotal: number;               // amount + taxAmount
  dimensions?: Record<string, string>;  // Dimension tags
}

export interface CreateInvoiceDto {
  contactId: string;
  reference?: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  lines: CreateInvoiceLineDto[];
  notes?: string;
}

export interface CreateInvoiceLineDto {
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  dimensions?: Record<string, string>;
}

/** Purchase bill */
export interface Bill {
  id: string;
  tenantId: string;
  entityId: string;
  contactId: string;
  billNumber: string;
  supplierReference?: string;
  status: BillStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  exchangeRate?: number;
  lines: BillLine[];
  subtotal: number;
  totalTax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  journalId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface BillLine {
  id: string;
  lineNumber: number;
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRateId?: string;
  taxAmount: number;
  lineTotal: number;
  dimensions?: Record<string, string>;
}

export interface CreateBillDto {
  contactId: string;
  supplierReference?: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  lines: CreateBillLineDto[];
  notes?: string;
}

export interface CreateBillLineDto {
  accountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  dimensions?: Record<string, string>;
}
