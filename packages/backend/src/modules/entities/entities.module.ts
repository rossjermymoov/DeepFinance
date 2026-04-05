import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityRecord } from './entity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EntityRecord])],
  controllers: [],
  providers: [],
})
export class EntitiesModule {}
