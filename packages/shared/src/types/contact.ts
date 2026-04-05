import { ContactType, PaymentMethod } from './enums';
import { Address } from './entity';

/** A customer, supplier, or both */
export interface Contact {
  id: string;
  tenantId: string;
  entityId: string;
  contactType: ContactType;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  vatNumber?: string;
  companyNumber?: string;
  defaultCurrency?: string;
  paymentTermsDays: number;
  creditLimit?: number;
  defaultPaymentMethod?: PaymentMethod;
  billingAddress?: Address;
  shippingAddress?: Address;
  bankDetails?: ContactBankDetails;
  isActive: boolean;
  notes?: string;
  customFields?: Record<string, unknown>;  // DEEP module extension fields
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactBankDetails {
  bankName?: string;
  accountName: string;
  sortCode: string;
  accountNumber: string;
}

export interface CreateContactDto {
  contactType: ContactType;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  vatNumber?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  billingAddress?: Address;
}
