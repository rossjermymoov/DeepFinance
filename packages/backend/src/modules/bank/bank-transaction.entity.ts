import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

@Entity('bank_transactions', { schema: 'core' })
@Index(['tenantId', 'entityId', 'bankAccountId', 'transactionDate'])
@Index(['tenantId', 'entityId', 'reconciliationStatus'])
@Index(['tenantId', 'entityId', 'bankAccountId'])
export class BankTransaction extends EntityScopedBase {
  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100, nullable: true })
  reference: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  balance: number | null;

  @Column({ length: 20 })
  type: string; // CREDIT | DEBIT

  @Column({ length: 50, nullable: true })
  category: string | null;

  @Column({
    name: 'reconciliation_status',
    length: 20,
    default: 'UNRECONCILED',
  })
  reconciliationStatus: string; // UNRECONCILED, MATCHED, RECONCILED, EXCLUDED

  @Column({ name: 'matched_journal_id', type: 'uuid', nullable: true })
  matchedJournalId: string | null;

  @Column({ name: 'import_source', length: 50, nullable: true })
  importSource: string | null;

  @Column({ name: 'import_batch_id', length: 50, nullable: true })
  importBatchId: string | null;
}
