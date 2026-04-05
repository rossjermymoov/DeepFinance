import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

@Entity('accounts', { schema: 'core' })
@Index(['tenantId', 'entityId', 'code'], { unique: true })
@Index(['tenantId', 'entityId', 'accountType'])
export class Account extends EntityScopedBase {
  @Column({ length: 20 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'account_type', length: 20 })
  accountType: string;

  @Column({ name: 'account_sub_type', length: 30 })
  accountSubType: string;

  @Column({ name: 'parent_account_id', type: 'uuid', nullable: true })
  parentAccountId: string;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'parent_account_id' })
  parentAccount: Account;

  @Column({ name: 'tax_rate_id', type: 'uuid', nullable: true })
  taxRateId: string;

  @Column({ length: 3, nullable: true })
  currency: string;

  @Column({ name: 'is_system_account', default: false })
  isSystemAccount: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'is_bank_account', default: false })
  isBankAccount: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown>;
}
