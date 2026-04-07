import { Entity, Column, Index } from 'typeorm';
import { EntityScopedBase } from '../../common/base.entity';

export enum VatScheme {
  STANDARD = 'STANDARD',
  FLAT_RATE = 'FLAT_RATE',
  CASH_ACCOUNTING = 'CASH_ACCOUNTING',
}

export enum VatReturnFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

@Entity('vat_settings', { schema: 'core' })
@Index(['tenantId', 'entityId'], { unique: true })
export class VatSettings extends EntityScopedBase {
  @Column({ name: 'vat_number', length: 20, nullable: true })
  vatNumber: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: VatScheme.STANDARD,
  })
  vatScheme: VatScheme;

  @Column({
    name: 'flat_rate_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  flatRatePercentage: number | null;

  @Column({
    name: 'flat_rate_category',
    length: 100,
    nullable: true,
  })
  flatRateCategory: string | null;

  @Column({
    name: 'return_frequency',
    type: 'varchar',
    length: 20,
    default: VatReturnFrequency.QUARTERLY,
  })
  returnFrequency: VatReturnFrequency;

  @Column({
    name: 'stagger_group',
    type: 'integer',
    nullable: true,
  })
  staggerGroup: number | null; // 1-3

  @Column({
    name: 'is_registered',
    type: 'boolean',
    default: false,
  })
  isRegistered: boolean;

  @Column({
    name: 'registration_date',
    type: 'date',
    nullable: true,
  })
  registrationDate: string | null;

  @Column({
    name: 'deregistration_date',
    type: 'date',
    nullable: true,
  })
  deregistrationDate: string | null;

  @Column({
    name: 'hmrc_client_id',
    type: 'text',
    nullable: true,
  })
  hmrcClientId: string | null;

  @Column({
    name: 'hmrc_client_secret',
    type: 'text',
    nullable: true,
  })
  hmrcClientSecret: string | null;

  @Column({
    name: 'hmrc_access_token',
    type: 'text',
    nullable: true,
  })
  hmrcAccessToken: string | null;

  @Column({
    name: 'hmrc_refresh_token',
    type: 'text',
    nullable: true,
  })
  hmrcRefreshToken: string | null;

  @Column({
    name: 'hmrc_token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  hmrcTokenExpiresAt: Date | null;

  @Column({
    name: 'last_synced_at',
    type: 'timestamp',
    nullable: true,
  })
  lastSyncedAt: Date | null;
}
