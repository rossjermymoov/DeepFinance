import { Entity, Column, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

export enum VatReturnStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  REVIEWED = 'REVIEWED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  AMENDED = 'AMENDED',
}

@Entity('vat_returns', { schema: 'core' })
@Index(['tenantId', 'entityId', 'periodStart', 'periodEnd'], { unique: true })
@Index(['tenantId', 'entityId', 'status'])
@Index(['tenantId', 'entityId', 'dueDate'])
export class VatReturn extends EntityScopedBase {
  @Column({
    name: 'period_start',
    type: 'date',
  })
  periodStart: string;

  @Column({
    name: 'period_end',
    type: 'date',
  })
  periodEnd: string;

  @Column({
    name: 'due_date',
    type: 'date',
  })
  dueDate: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: VatReturnStatus.DRAFT,
  })
  status: VatReturnStatus;

  @Column({
    name: 'vat_scheme_used',
    length: 30,
  })
  vatSchemeUsed: string;

  @Column({
    name: 'box1',
    type: 'bigint',
    default: 0,
  })
  box1: bigint; // VAT due on sales (pence)

  @Column({
    name: 'box2',
    type: 'bigint',
    default: 0,
  })
  box2: bigint; // VAT due on EU acquisitions (pence)

  @Column({
    name: 'box3',
    type: 'bigint',
    default: 0,
  })
  box3: bigint; // Total VAT due (pence)

  @Column({
    name: 'box4',
    type: 'bigint',
    default: 0,
  })
  box4: bigint; // VAT reclaimed on purchases (pence)

  @Column({
    name: 'box5',
    type: 'bigint',
    default: 0,
  })
  box5: bigint; // Net VAT to pay/reclaim (pence)

  @Column({
    name: 'box6',
    type: 'bigint',
    default: 0,
  })
  box6: bigint; // Total sales excluding VAT (pence)

  @Column({
    name: 'box7',
    type: 'bigint',
    default: 0,
  })
  box7: bigint; // Total purchases excluding VAT (pence)

  @Column({
    name: 'box8',
    type: 'bigint',
    default: 0,
  })
  box8: bigint; // Total goods supplied to EU (pence)

  @Column({
    name: 'box9',
    type: 'bigint',
    default: 0,
  })
  box9: bigint; // Total goods acquired from EU (pence)

  @Column({
    name: 'calculated_at',
    type: 'timestamp',
    nullable: true,
  })
  calculatedAt: Date | null;

  @Column({
    name: 'submitted_at',
    type: 'timestamp',
    nullable: true,
  })
  submittedAt: Date | null;

  @Column({
    name: 'hmrc_correlation_id',
    length: 100,
    nullable: true,
  })
  hmrcCorrelationId: string | null;

  @Column({
    name: 'hmrc_receipt_id',
    length: 100,
    nullable: true,
  })
  hmrcReceiptId: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string | null;

  @Column({
    name: 'submission_payload',
    type: 'jsonb',
    nullable: true,
  })
  submissionPayload: Record<string, any> | null;

  @Column({
    name: 'response_payload',
    type: 'jsonb',
    nullable: true,
  })
  responsePayload: Record<string, any> | null;
}
