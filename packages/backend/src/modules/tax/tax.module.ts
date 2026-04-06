import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxRate } from './tax-rate.entity';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRate])],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}
