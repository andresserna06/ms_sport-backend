import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../teams/entities/team.entity';
import { TournamentsModule } from '../../tournaments/tournaments.module';
import { PhasesModule } from '../base/phases.module';
import { Group } from './entities/group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupMapper } from './mappers/group.mapper';
import { GROUP_REPOSITORY } from './repositories/group.repository';
import { GroupTypeOrmRepository } from './repositories/group.typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, Team]),
    PhasesModule,
    TournamentsModule,
  ],
  controllers: [GroupController],
  providers: [
    GroupService,
    GroupMapper,
    {
      provide: GROUP_REPOSITORY,
      useClass: GroupTypeOrmRepository,
    },
  ],
  exports: [GroupService],
})
export class GroupModule {}
