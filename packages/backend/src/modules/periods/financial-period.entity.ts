import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

@Entity('financial_periods', { schema: 'core' })
@Index(['tenantId', 'entityId', 'startDate', 'endDate'])
@Index(['tenantId', 'entityId', 'status'])
export class FinancialPeriod extends EntityScopedBase {
  @Column({ length: 50 })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ length: 10, default: 'OPEN' })
  status: string; // OPEN, CLOSED, LOCKED

  @Column({ name: 'financial_year', length: 10 })
  financialYear: string; // e.g., '2026/27'

  @Column({ name: 'period_number', type: 'int' })
  periodNumber: number; // 1-12 (or 1-13 for year-end adjustment period)

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy: string | null;

  @Column({ name: 'locked_at', type: 'timestamp', nullable: true })
  lockedAt: Date | null;

  @Column({ name: 'locked_by', type: 'uuid', nullable: true })
  lockedBy: string | null;
}
