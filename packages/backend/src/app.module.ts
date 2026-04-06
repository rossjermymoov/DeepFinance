import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'pg';

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
    // Supports DATABASE_URL (Railway/production) or individual vars (local dev)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        // Ensure the 'core' schema exists before TypeORM tries to use it
        const client = new Client(
          databaseUrl
            ? { connectionString: databaseUrl, ssl: config.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false }
            : {
                host: config.get<string>('DATABASE_HOST', 'localhost'),
                port: config.get<number>('DATABASE_PORT', 5432),
                user: config.get<string>('DATABASE_USER', 'deepfinance'),
                password: config.get<string>('DATABASE_PASSWORD', 'deepfinance_dev'),
                database: config.get<string>('DATABASE_NAME', 'deepfinance'),
              },
        );
        try {
          await client.connect();
          await client.query('CREATE SCHEMA IF NOT EXISTS core');
        } finally {
          await client.end();
        }

        const baseConfig = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
          logging: config.get<string>('NODE_ENV') === 'development',
          schema: 'core',
        };

        if (databaseUrl) {
          // Railway / production — single connection string
          return {
            ...baseConfig,
            url: databaseUrl,
            ssl: config.get<string>('DB_SSL', 'false') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          };
        }

        // Local dev — individual variables
        return {
          ...baseConfig,
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: config.get<number>('DATABASE_PORT', 5432),
          username: config.get<string>('DATABASE_USER', 'deepfinance'),
          password: config.get<string>('DATABASE_PASSWORD', 'deepfinance_dev'),
          database: config.get<string>('DATABASE_NAME', 'deepfinance'),
        };
      },
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
