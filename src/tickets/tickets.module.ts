import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansModule } from '../fans/fans.module';
import { MatchesModule } from '../matches/matches.module';
import { SeatingZonesModule } from '../seating-zones/seating-zones.module';
import { TicketsController } from './controllers/tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { TicketMapper } from './mappers/ticket.mapper';
import { TICKETS_REPOSITORY } from './repositories/ticket.repository';
import { TicketTypeOrmRepository } from './repositories/ticket.typeorm.repository';
import { TicketsService } from './services/tickets.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    FansModule,
    MatchesModule,
    SeatingZonesModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    TicketMapper,
    { provide: TICKETS_REPOSITORY, useClass: TicketTypeOrmRepository },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
