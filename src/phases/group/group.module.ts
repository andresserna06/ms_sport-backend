import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupMapper } from './mappers/group.mapper';
import { PhasesModule } from '../base/phases.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group]), PhasesModule],
  controllers: [GroupController],
  providers: [GroupService, GroupMapper],
  exports: [GroupService],
})
export class GroupModule {}
