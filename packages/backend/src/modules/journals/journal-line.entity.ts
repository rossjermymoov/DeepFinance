import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Journal } from './journal.entity';

@Entity('journal_lines', { schema: 'core' })
@Index(['journalId'])
@Index(['accountId'])
export class JournalLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'journal_id', type: 'uuid' })
  journalId: string;

  @ManyToOne(() => Journal, (journal) => journal.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ length: 3, default: 'GBP' })
  currency: string;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 12, scale: 6, nullable: true })
  exchangeRate: number | null;

  @Column({ name: 'base_currency_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  baseCurrencyDebit: number;

  @Column({ name: 'base_currency_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  baseCurrencyCredit: number;

  @Column({ name: 'tax_rate_id', type: 'uuid', nullable: true })
  taxRateId: string | null;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  taxAmount: number | null;

  // Dimensional tags stored as JSONB for flexibility
  // Format: { "DEPARTMENT": "uuid", "PROJECT": "uuid", "COST_CENTRE": "uuid" }
  @Column({ type: 'jsonb', nullable: true })
  dimensions: Record<string, string> | null;

  // DEEP module extension metadata
  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown> | null;
}
