import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

@Entity('tax_rates', { schema: 'core' })
@Index(['tenantId', 'entityId', 'code'], { unique: true })
@Index(['tenantId', 'entityId', 'isActive'])
export class TaxRate extends EntityScopedBase {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  code: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  rate: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;
}
