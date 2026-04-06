import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './bill.entity';
import { BillLine } from './bill-line.entity';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, BillLine])],
  providers: [BillsService],
  controllers: [BillsController],
  exports: [BillsService],
})
export class BillsModule {}
