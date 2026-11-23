import { TournamentVenue } from '../entities/tournament-venue.entity';

export const TOURNAMENT_VENUES_REPOSITORY = Symbol(
  'TOURNAMENT_VENUES_REPOSITORY',
);

export interface TournamentVenueRepository {
  findAll(): Promise<TournamentVenue[]>;
  findById(id: number): Promise<TournamentVenue | null>;
  existsByTournamentAndVenue(
    tournamentId: number,
    venueId: number,
  ): Promise<boolean>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: TournamentVenue): Promise<TournamentVenue>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: TournamentVenue): Promise<void>;
}
