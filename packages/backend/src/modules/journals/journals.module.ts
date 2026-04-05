import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journal } from './journal.entity';
import { JournalLine } from './journal-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Journal, JournalLine])],
  controllers: [],
  providers: [],
})
export class JournalsModule {}
