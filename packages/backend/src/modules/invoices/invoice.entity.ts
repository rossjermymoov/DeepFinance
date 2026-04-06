import {
  Entity,
  Column,
  OneToMany,
  Index,
  Relation,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';
import { InvoiceLine } from './invoice-line.entity';

@Entity('invoices', { schema: 'core' })
@Index(['tenantId', 'entityId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'entityId', 'contactId'])
@Index(['tenantId', 'entityId', 'status'])
export class Invoice extends EntityScopedBase {
  @Column({ name: 'invoice_number', length: 20 })
  invoiceNumber: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ length: 50, default: 'DRAFT' })
  status: string; // DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID

  @Column({ length: 3, default: 'GBP' })
  currency: string;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  subtotal: number;

  @Column({
    name: 'tax_total',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  taxTotal: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  total: number;

  @Column({
    name: 'amount_paid',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountPaid: number;

  @Column({ length: 100, nullable: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'journal_id', type: 'uuid', nullable: true })
  journalId: string | null;

  @OneToMany(() => InvoiceLine, (line) => line.invoice, {
    cascade: true,
    eager: true,
  })
  lines: Relation<InvoiceLine[]>;
}
