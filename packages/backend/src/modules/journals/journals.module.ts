import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journal } from './journal.entity';
import { JournalLine } from './journal-line.entity';
import { Account } from '../accounts/account.entity';
import { JournalsController } from './journals.controller';
import { JournalsService } from './journals.service';
import { PeriodsModule } from '../periods/periods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, JournalLine, Account]),
    PeriodsModule,
  ],
  controllers: [JournalsController],
  providers: [JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
