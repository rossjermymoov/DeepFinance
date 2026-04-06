import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';
import { JournalLine } from './journal-line.entity';

@Entity('journals', { schema: 'core' })
@Index(['tenantId', 'entityId', 'journalNumber'], { unique: true })
@Index(['tenantId', 'entityId', 'date'])
@Index(['tenantId', 'entityId', 'status'])
@Index(['tenantId', 'entityId', 'sourceType', 'sourceId'])
export class Journal extends EntityScopedBase {
  @Column({ name: 'journal_number', length: 20 })
  journalNumber: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'period_id', type: 'uuid' })
  periodId: string;

  @Column({ length: 20, default: 'STANDARD' })
  type: string;

  @Column({ length: 10, default: 'DRAFT' })
  status: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100, nullable: true })
  reference: string;

  @Column({ name: 'source_type', length: 30, default: 'MANUAL' })
  sourceType: string;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string;

  @Column({ length: 3, default: 'GBP' })
  currency: string;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 12, scale: 6, nullable: true })
  exchangeRate: number;

  @OneToMany(() => JournalLine, (line) => line.journal, { cascade: true, eager: true })
  lines: JournalLine[];

  @Column({ name: 'total_debit', type: 'decimal', precision: 15, scale: 2 })
  totalDebit: number;

  @Column({ name: 'total_credit', type: 'decimal', precision: 15, scale: 2 })
  totalCredit: number;

  @Column({ name: 'is_reversed', default: false })
  isReversed: boolean;

  @Column({ name: 'reversed_by_journal_id', type: 'uuid', nullable: true })
  reversedByJournalId: string;

  @Column({ name: 'reverses_journal_id', type: 'uuid', nullable: true })
  reversesJournalId: string;

  // ── Amendment tracking ──────────────────────────────────────
  // When an admin amends a posted journal:
  //   Original: isAmended=true, amendedByJournalId → new journal, status=AMENDED (red)
  //   New:      amendsJournalId → original, type=AMENDMENT

  @Column({ name: 'is_amended', default: false })
  isAmended: boolean;

  @Column({ name: 'amended_by_journal_id', type: 'uuid', nullable: true })
  amendedByJournalId: string | null;

  @Column({ name: 'amends_journal_id', type: 'uuid', nullable: true })
  amendsJournalId: string | null;

  @Column({ name: 'amendment_reason', type: 'text', nullable: true })
  amendmentReason: string | null;

  // ── Posting metadata ────────────────────────────────────────

  @Column({ name: 'posted_at', type: 'timestamp', nullable: true })
  postedAt: Date;

  @Column({ name: 'posted_by', type: 'uuid', nullable: true })
  postedBy: string;
}
