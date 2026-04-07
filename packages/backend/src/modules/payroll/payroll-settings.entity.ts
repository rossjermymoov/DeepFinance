import { Entity, Column, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

@Entity('payroll_settings', { schema: 'core' })
@Index(['tenantId', 'entityId'], { unique: true })
export class PayrollSettings extends EntityScopedBase {
  @Column({ length: 50, nullable: true })
  employerPayeRef: string;

  @Column({ length: 50, nullable: true })
  accountsOfficeRef: string;

  @Column({ length: 255, nullable: true })
  employerName: string;

  @Column({ length: 10, default: '2025-26' })
  taxYear: string;

  @Column({ type: 'text', nullable: true })
  hmrcClientId: string;

  @Column({ type: 'text', nullable: true })
  hmrcClientSecret: string;

  @Column({ type: 'text', nullable: true })
  hmrcAccessToken: string;

  @Column({ type: 'text', nullable: true })
  hmrcRefreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  hmrcTokenExpiresAt: Date;

  @Column({ default: false })
  smallEmployerRelief: boolean;

  @Column({ default: false })
  employmentAllowanceClaimable: boolean;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  employmentAllowanceClaimed: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRtiSubmissionAt: Date;
}
