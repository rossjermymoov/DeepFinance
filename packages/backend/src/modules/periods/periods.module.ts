import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialPeriod } from './financial-period.entity';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialPeriod])],
  providers: [PeriodsService],
  controllers: [PeriodsController],
  exports: [PeriodsService],
})
export class PeriodsModule {}
