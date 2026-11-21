import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesModule } from './matches/matches.module';
import { FinalModule } from './phases/final/final.module';
import { GroupModule } from './phases/group/group.module';
import { PhasesModule } from './phases/base/phases.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { TeamsModule } from './teams/teams.module';
import { SportsModule } from './sports/sports.module';
import { SkillsModule } from './skills/skills.module';
import { PlayersModule } from './players/players.module';
import { PlayerSkillsModule } from './player-skills/player-skills.module';
import { PlayerContractsModule } from './player-contracts/player-contracts.module';
import { PlayerProfileModule } from './player-profile/player-profile.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScoringEventsModule } from './scoring-events/scoring-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Schema changes are applied only through migrations (src/migrations).
        synchronize: false,
      }),
    }),
    MatchesModule,
    PhasesModule,
    GroupModule,
    FinalModule,
    TournamentsModule,
    TeamsModule,
    SportsModule,
    SkillsModule,
    PlayersModule,
    PlayerSkillsModule,
    PlayerContractsModule,
    PlayerProfileModule,
    NotificationsModule,
    ScoringEventsModule,
  ],
})
export class AppModule {}
