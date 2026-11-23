import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateBallDto } from '../dtos/create-ball.dto';
import { BallResponseDto } from '../dtos/ball-response.dto';
import { UpdateBallDto } from '../dtos/update-ball.dto';
import { Ball } from '../entities/ball.entity';
import { BallMapper } from '../mappers/ball.mapper';
import {
  BALLS_REPOSITORY,
  type BallRepository,
} from '../repositories/ball.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'la pelota',
  duplicate: 'El partido ya tiene una pelota o el número de serie ya existe',
  references: {
    FK_balls_match: 'el partido',
  },
};

@Injectable()
export class BallsService {
  constructor(
    @Inject(BALLS_REPOSITORY) private readonly repository: BallRepository,
    private readonly mapper: BallMapper,
  ) {}

  async create(dto: CreateBallDto): Promise<BallResponseDto> {
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<BallResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<BallResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(id: number, dto: UpdateBallDto): Promise<BallResponseDto> {
    const entity = await this.getOrFail(id);
    const saved = await this.save(this.mapper.replaceEntity(entity, dto));
    return this.mapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.getOrFail(id);
    try {
      await this.repository.remove(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }

  private async getOrFail(id: number): Promise<Ball> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la pelota con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: Ball): Promise<Ball> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
