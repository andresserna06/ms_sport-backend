import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Final } from './entities/final.entity';
import { FinalController } from './final.controller';
import { FinalService } from './final.service';
import { FinalMapper } from './mappers/final.mapper';
import { PhasesModule } from '../base/phases.module';

@Module({
  imports: [TypeOrmModule.forFeature([Final]), PhasesModule],
  controllers: [FinalController],
  providers: [FinalService, FinalMapper],
  exports: [FinalService],
})
export class FinalModule {}
