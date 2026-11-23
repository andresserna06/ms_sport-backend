import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpSecurityFanRoleAssignerClient } from './clients/http-security-fan-role-assigner.client';
import { FansController } from './controllers/fans.controller';
import { Fan } from './entities/fan.entity';
import { FanMapper } from './mappers/fan.mapper';
import { FAN_ROLE_ASSIGNER } from './ports/fan-role-assigner.port';
import { FANS_REPOSITORY } from './repositories/fan.repository';
import { FanTypeOrmRepository } from './repositories/fan.typeorm.repository';
import { FansService } from './services/fans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fan])],
  controllers: [FansController],
  providers: [
    FansService,
    FanMapper,
    { provide: FANS_REPOSITORY, useClass: FanTypeOrmRepository },
    { provide: FAN_ROLE_ASSIGNER, useClass: HttpSecurityFanRoleAssignerClient },
  ],
  exports: [FansService],
})
export class FansModule {}
