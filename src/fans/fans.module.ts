import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansController } from './controllers/fans.controller';
import { Fan } from './entities/fan.entity';
import { FanMapper } from './mappers/fan.mapper';
import { FANS_REPOSITORY } from './repositories/fan.repository';
import { FanTypeOrmRepository } from './repositories/fan.typeorm.repository';
import { FansService } from './services/fans.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([Fan])],
  controllers: [FansController],
  providers: [
    FansService,
    FanMapper,
    { provide: FANS_REPOSITORY, useClass: FanTypeOrmRepository },
  ],
  exports: [FansService],
})
export class FansModule {}
