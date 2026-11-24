import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { FanTeam } from '../../fan-teams/entities/fan-team.entity';
import { Match } from '../../matches/entities/match.entity';
import { PlayerContract } from '../../player-contracts/entities/player-contract.entity';
import { Group } from '../../phases/group/entities/group.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { ScoringEvent } from '../../scoring-events/entities/scoring-event.entity';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

@Entity('teams')
@Index('UQ_teams_name', ['name'], { unique: true })
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ name: 'contact_email', length: 150 })
  contactEmail!: string;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  foundedYear!: number | null;

  // Team crest as an image data URL (base64), like the profile photo of ms_security.
  @Column({ type: 'longtext', nullable: true })
  logo!: string | null;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Group, (group) => group.teams, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  group!: Relation<Group | null>;

  @OneToMany(() => Registration, (registration) => registration.team)
  registrations?: Relation<Registration[]>;

  @OneToMany(() => Match, (match) => match.homeTeam)
  homeMatches?: Relation<Match[]>;

  @OneToMany(() => Match, (match) => match.awayTeam)
  awayMatches?: Relation<Match[]>;

  @OneToMany(() => PlayerContract, (contract) => contract.team)
  playerContracts?: Relation<PlayerContract[]>;

  @OneToMany(() => ScoringEvent, (scoringEvent) => scoringEvent.team)
  scoringEvents?: Relation<ScoringEvent[]>;

  @OneToMany(() => FanTeam, (fanTeam) => fanTeam.team)
  fanTeams?: Relation<FanTeam[]>;

  @OneToMany(() => TeamSport, (teamSport) => teamSport.team)
  teamSports!: Relation<TeamSport>[];
}
