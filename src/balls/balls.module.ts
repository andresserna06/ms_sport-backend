import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BallsController } from './controllers/balls.controller';
import { Ball } from './entities/ball.entity';
import { BallMapper } from './mappers/ball.mapper';
import { BALLS_REPOSITORY } from './repositories/ball.repository';
import { BallTypeOrmRepository } from './repositories/ball.typeorm.repository';
import { BallsService } from './services/balls.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([Ball])],
  controllers: [BallsController],
  providers: [
    BallsService,
    BallMapper,
    { provide: BALLS_REPOSITORY, useClass: BallTypeOrmRepository },
  ],
  exports: [BallsService],
})
export class BallsModule {}
