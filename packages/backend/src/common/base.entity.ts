import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base entity with common fields for all DeepFinance entities.
 * Every entity is scoped by tenantId for multi-tenant isolation.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}

/**
 * Extended base for entities that also scope by entity (legal entity).
 * Most financial entities use this.
 */
export abstract class EntityScopedBase extends BaseEntity {
  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;
}
