import { Entity, Column, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

export enum EmployeeTitle {
  MR = 'MR',
  MRS = 'MRS',
  MS = 'MS',
  MISS = 'MISS',
  DR = 'DR',
}

export enum EmployeeGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum PayFrequency {
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  FOUR_WEEKLY = 'FOUR_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum PayMethod {
  SALARY = 'SALARY',
  HOURLY = 'HOURLY',
}

export enum NiCategory {
  A = 'A',
  B = 'B',
  C = 'C',
  F = 'F',
  H = 'H',
  I = 'I',
  J = 'J',
  L = 'L',
  M = 'M',
  S = 'S',
  V = 'V',
  Z = 'Z',
}

export enum StudentLoanPlan {
  NONE = 'NONE',
  PLAN_1 = 'PLAN_1',
  PLAN_2 = 'PLAN_2',
  PLAN_4 = 'PLAN_4',
  POSTGRAD = 'POSTGRAD',
}

@Entity('employees', { schema: 'core' })
@Index(['tenantId', 'entityId', 'employeeNumber'], { unique: true })
@Index(['tenantId', 'entityId', 'isActive'])
@Index(['tenantId', 'entityId', 'niNumber'])
export class Employee extends EntityScopedBase {
  @Column({ length: 50 })
  employeeNumber: string;

  @Column({ type: 'enum', enum: EmployeeTitle, nullable: true })
  title: EmployeeTitle;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50, nullable: true })
  middleName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: EmployeeGender })
  gender: EmployeeGender;

  @Column({ length: 20, nullable: true })
  niNumber: string;

  @Column({ length: 10 })
  taxCode: string;

  @Column({ type: 'enum', enum: NiCategory, default: NiCategory.A })
  niCategory: NiCategory;

  @Column({ type: 'enum', enum: PayFrequency })
  payFrequency: PayFrequency;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  basicPayRate: number;

  @Column({ type: 'enum', enum: PayMethod })
  payMethod: PayMethod;

  @Column({ length: 10, nullable: true })
  bankSortCode: string;

  @Column({ length: 20, nullable: true })
  bankAccountNumber: string;

  @Column({ length: 100, nullable: true })
  bankAccountName: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  leaveDate: Date;

  @Column({ default: false })
  isDirector: boolean;

  @Column({ type: 'enum', enum: StudentLoanPlan, default: StudentLoanPlan.NONE })
  studentLoanPlan: StudentLoanPlan;

  @Column({ default: false })
  pensionOptOut: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 5.0 })
  pensionContributionPct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 3.0 })
  employerPensionPct: number;

  @Column({ length: 100 })
  addressLine1: string;

  @Column({ length: 100, nullable: true })
  addressLine2: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 50, nullable: true })
  county: string;

  @Column({ length: 10 })
  postcode: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  cumulativeGrossPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  cumulativeTaxPaid: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  cumulativeNiEmployee: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  cumulativeNiEmployer: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  previousEmploymentPay: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  previousEmploymentTax: number;

  @Column({ type: 'integer', nullable: true })
  weekNumber: number;

  @Column({ type: 'integer', nullable: true })
  monthNumber: number;
}
