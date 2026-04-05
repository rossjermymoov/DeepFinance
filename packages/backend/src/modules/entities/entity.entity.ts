import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Entity('entities', { schema: 'core' })
export class EntityRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.entities)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'legal_name', length: 255 })
  legalName: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'base_currency', length: 3, default: 'GBP' })
  baseCurrency: string;

  @Column({ name: 'tax_jurisdiction', length: 5, default: 'GB' })
  taxJurisdiction: string;

  @Column({ name: 'company_number', length: 20, nullable: true })
  companyNumber: string;

  @Column({ name: 'vat_number', length: 20, nullable: true })
  vatNumber: string;

  @Column({ name: 'charity_number', length: 20, nullable: true })
  charityNumber: string;

  @Column({ name: 'registered_address', type: 'jsonb', nullable: true })
  registeredAddress: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    vatScheme?: string;
    vatPeriodMonths?: number;
    chartOfAccountsTemplate?: string;
    defaultPaymentTermsDays: number;
    invoicePrefix?: string;
    invoiceNextNumber?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
