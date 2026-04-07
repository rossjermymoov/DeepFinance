import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';
import { PayRun } from './pay-run.entity';
import { Employee } from './employee.entity';

@Entity('payslips', { schema: 'core' })
@Index(['tenantId', 'entityId', 'payRunId', 'employeeId'], { unique: true })
@Index(['tenantId', 'entityId', 'payRunId'])
@Index(['tenantId', 'entityId', 'employeeId'])
export class Payslip extends EntityScopedBase {
  @Column({ type: 'uuid' })
  payRunId: string;

  @ManyToOne(() => PayRun)
  @JoinColumn({ name: 'pay_run_id' })
  payRun: PayRun;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  basicPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  bonusPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  commissionPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  grossPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  taxableGross: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  taxDeducted: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  niEmployeeContribution: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  niEmployerContribution: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  studentLoanDeduction: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  pensionEmployeeContribution: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  pensionEmployerContribution: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  otherAdditions: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  netPay: number;

  @Column({ length: 10 })
  taxCode: string;

  @Column({ length: 10 })
  niCategory: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  niablePay: number;

  @Column({ type: 'numeric', precision: 7, scale: 2, nullable: true })
  hoursWorked: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  cumulativeGrossPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  cumulativeTaxPaid: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  cumulativeNiEmployee: number;

  @Column({ length: 20 })
  payMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
