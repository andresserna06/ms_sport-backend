import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../entities/registration.entity';

export const REGISTRATION_REPOSITORY = Symbol('REGISTRATION_REPOSITORY');

export interface RegistrationRepository {
  findById(id: number): Promise<Registration | null>;
  findByTournament(tournamentId: number): Promise<Registration[]>;
  findByTeam(teamId: number): Promise<Registration[]>;
  findByTournamentAndTeam(tournamentId: number, teamId: number): Promise<Registration | null>;
  save(registration: Registration): Promise<Registration>;
  remove(registration: Registration): Promise<void>;
}

@Injectable()
export class RegistrationTypeOrmRepository implements RegistrationRepository {
  constructor(
    @InjectRepository(Registration)
    private readonly repository: Repository<Registration>,
  ) {}

  findById(id: number): Promise<Registration | null> {
    return this.repository.findOne({
      where: { id },
      relations: { team: true, tournament: true },
    });
  }

  findByTournament(tournamentId: number): Promise<Registration[]> {
    return this.repository.find({
      where: { tournament: { id: tournamentId } },
      relations: { team: true, tournament: true },
      order: { registeredAt: 'ASC' },
    });
  }

  findByTeam(teamId: number): Promise<Registration[]> {
    return this.repository.find({
      where: { team: { id: teamId } },
      relations: { team: true, tournament: true },
      order: { registeredAt: 'ASC' },
    });
  }

  findByTournamentAndTeam(tournamentId: number, teamId: number): Promise<Registration | null> {
    return this.repository.findOne({
      where: { tournament: { id: tournamentId }, team: { id: teamId } },
      relations: { team: true, tournament: true },
    });
  }

  save(registration: Registration): Promise<Registration> {
    return this.repository.save(registration);
  }

  async remove(registration: Registration): Promise<void> {
    await this.repository.remove(registration);
  }
}
