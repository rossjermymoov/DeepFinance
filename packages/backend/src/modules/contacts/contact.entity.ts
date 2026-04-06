import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

@Entity('contacts', { schema: 'core' })
@Index(['tenantId', 'entityId', 'contactType'])
@Index(['tenantId', 'entityId', 'name'])
export class Contact extends EntityScopedBase {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  contactType: string; // CUSTOMER, SUPPLIER, BOTH

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ length: 50, nullable: true })
  phone: string | null;

  @Column({ name: 'company_name', length: 255, nullable: true })
  companyName: string | null;

  @Column({ name: 'tax_number', length: 50, nullable: true })
  taxNumber: string | null;

  @Column({ name: 'account_number', length: 50, nullable: true })
  accountNumber: string | null;

  @Column({
    name: 'default_payment_terms_days',
    type: 'int',
    default: 30,
  })
  defaultPaymentTermsDays: number;

  @Column({
    name: 'billing_address',
    type: 'jsonb',
    nullable: true,
  })
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  } | null;

  @Column({ length: 3, default: 'GBP' })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
