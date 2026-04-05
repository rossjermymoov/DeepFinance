import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityRecord } from '../entities/entity.entity';

@Entity('tenants', { schema: 'core' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    defaultCurrency: string;
    defaultTaxJurisdiction: string;
    financialYearStartMonth: number;
    dateFormat: string;
    numberFormat: string;
  };

  @OneToMany(() => EntityRecord, (entity) => entity.tenant)
  entities: EntityRecord[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
