import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Core modules
import { AccountsModule } from './modules/accounts/accounts.module';
import { JournalsModule } from './modules/journals/journals.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { BillsModule } from './modules/bills/bills.module';
import { BankModule } from './modules/bank/bank.module';
import { TaxModule } from './modules/tax/tax.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { ReportsModule } from './modules/reports/reports.module';

// Infrastructure
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'deepfinance'),
        password: config.get('DATABASE_PASSWORD', 'deepfinance_dev'),
        database: config.get('DATABASE_NAME', 'deepfinance'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,        // Never auto-sync in production
        logging: config.get('NODE_ENV') === 'development',
        schema: 'core',
      }),
    }),

    // Infrastructure
    AuthModule,
    HealthModule,

    // Core finance modules
    TenantsModule,
    EntitiesModule,
    AccountsModule,
    JournalsModule,
    ContactsModule,
    InvoicesModule,
    BillsModule,
    BankModule,
    TaxModule,
    PeriodsModule,
    ReportsModule,
  ],
})
export class AppModule {}
