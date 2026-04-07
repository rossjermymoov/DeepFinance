import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Employee } from './employee.entity';
import { PayRun } from './pay-run.entity';
import { Payslip } from './payslip.entity';
import { PayrollSettings } from './payroll-settings.entity';

// Services
import { PayrollService } from './payroll.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { HmrcRtiService } from './hmrc-rti.service';

// Controllers
import { PayrollController } from './payroll.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Employee,
      PayRun,
      Payslip,
      PayrollSettings,
    ]),
  ],
  controllers: [PayrollController],
  providers: [
    PayrollService,
    PayrollCalculationService,
    HmrcRtiService,
  ],
  exports: [
    PayrollService,
    PayrollCalculationService,
    HmrcRtiService,
  ],
})
export class PayrollModule {}
