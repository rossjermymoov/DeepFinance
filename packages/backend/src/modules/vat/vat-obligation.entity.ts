import { Entity, Column, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

export enum VatObligationStatus {
  OPEN = 'OPEN',
  FULFILLED = 'FULFILLED',
}

@Entity('vat_obligations', { schema: 'core' })
@Index(['tenantId', 'entityId', 'periodStart', 'periodEnd'], { unique: true })
@Index(['tenantId', 'entityId', 'status'])
@Index(['tenantId', 'entityId', 'dueDate'])
export class VatObligation extends EntityScopedBase {
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
    length: 20,
    default: VatObligationStatus.OPEN,
  })
  status: VatObligationStatus;

  @Column({
    name: 'hmrc_period_key',
    length: 10,
    nullable: true,
  })
  hmrcPeriodKey: string | null;

  @Column({
    name: 'received_date',
    type: 'date',
    nullable: true,
  })
  receivedDate: string | null;

  @Column({
    name: 'vat_return_id',
    type: 'uuid',
    nullable: true,
  })
  vatReturnId: string | null;
}
