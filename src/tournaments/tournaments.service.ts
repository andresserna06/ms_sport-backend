import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsRepository } from './repositories/tournaments.repository';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>,
    private readonly customTournamentsRepository: TournamentsRepository,
    private readonly tournamentMapper: TournamentMapper,
  ) {}

  async create(dto: CreateTournamentDto): Promise<TournamentResponseDto> {
    const entity = this.tournamentMapper.toEntity(dto);
    this.validateDates(entity);
    const saved = await this.tournamentsRepository.save(entity);
    return this.tournamentMapper.toResponseDto(saved);
  }

  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentsRepository.find({
      order: { startDate: 'ASC' },
    });
    return this.tournamentMapper.toResponseDtoList(tournaments);
  }

  async findOne(id: number): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }
    return this.tournamentMapper.toResponseDto(tournament);
  }

  async update(
    id: number,
    dto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }

    const merged = this.tournamentMapper.mergeEntity(tournament, dto);
    this.validateDates(merged);

    const saved = await this.tournamentsRepository.save(merged);
    return this.tournamentMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with id ${id} not found`);
    }

    await this.tournamentsRepository.remove(tournament);
    return { message: `Tournament #${id} deleted successfully` };
  }

  async getOpenEnrollmentReport(): Promise<TournamentResponseDto[]> {
    return this.customTournamentsRepository.findOpenEnrollmentReport();
  }

  private validateDates(tournament: Tournament): void {
    if (tournament.enrollmentDeadline > tournament.startDate) {
      throw new BadRequestException(
        'The enrollment deadline cannot be after the start date',
      );
    }
  }
}
