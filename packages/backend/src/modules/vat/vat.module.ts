import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { VatSettings } from './vat-settings.entity';
import { VatReturn } from './vat-return.entity';
import { VatObligation } from './vat-obligation.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Bill } from '../bills/bill.entity';

// Services
import { VatService } from './vat.service';
import { VatCalculationService } from './vat-calculation.service';
import { HmrcMtdService } from './hmrc-mtd.service';

// Controllers
import { VatReturnsController } from './vat-returns.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      VatSettings,
      VatReturn,
      VatObligation,
      Invoice,
      Bill,
    ]),
  ],
  controllers: [VatReturnsController],
  providers: [VatService, VatCalculationService, HmrcMtdService],
  exports: [VatService, VatCalculationService, HmrcMtdService],
})
export class VatModule {}
