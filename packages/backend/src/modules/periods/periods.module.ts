import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialPeriod } from './financial-period.entity';
import { PeriodsService } from './periods.service';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialPeriod])],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}
