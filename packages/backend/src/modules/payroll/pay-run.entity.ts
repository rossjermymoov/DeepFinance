import { Entity, Column, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';
import { PayFrequency } from './employee.entity';

export enum PayRunStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  REVIEWED = 'REVIEWED',
  SUBMITTED = 'SUBMITTED',
  COMPLETED = 'COMPLETED',
}

@Entity('pay_runs', { schema: 'core' })
@Index(['tenantId', 'entityId', 'payRunNumber'], { unique: true })
@Index(['tenantId', 'entityId', 'taxYear', 'taxPeriod'], { unique: true })
@Index(['tenantId', 'entityId', 'status'])
@Index(['tenantId', 'entityId', 'periodStart', 'periodEnd'])
export class PayRun extends EntityScopedBase {
  @Column({ length: 50 })
  payRunNumber: string;

  @Column({ type: 'enum', enum: PayFrequency })
  payFrequency: PayFrequency;

  @Column({ type: 'integer' })
  taxPeriod: number;

  @Column({ length: 10 })
  taxYear: string;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'enum', enum: PayRunStatus, default: PayRunStatus.DRAFT })
  status: PayRunStatus;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalGrossPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalTaxDeducted: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalNiEmployee: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalNiEmployer: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalStudentLoan: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalPensionEmployee: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalPensionEmployer: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalNetPay: number;

  @Column({ type: 'integer', default: 0 })
  employeeCount: number;

  @Column({ length: 100, nullable: true })
  hmrcSubmissionId: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
