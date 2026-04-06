import {
  Entity,
  Column,
  OneToMany,
  Index,
  Relation,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';
import { BillLine } from './bill-line.entity';

@Entity('bills', { schema: 'core' })
@Index(['tenantId', 'entityId', 'billNumber'], { unique: true })
@Index(['tenantId', 'entityId', 'contactId'])
@Index(['tenantId', 'entityId', 'status'])
export class Bill extends EntityScopedBase {
  @Column({ name: 'bill_number', length: 20 })
  billNumber: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ length: 50, default: 'DRAFT' })
  status: string; // DRAFT, APPROVED, PARTIALLY_PAID, PAID, OVERDUE, VOID

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

  @OneToMany(() => BillLine, (line) => line.bill, {
    cascade: true,
    eager: true,
  })
  lines: Relation<BillLine[]>;
}
