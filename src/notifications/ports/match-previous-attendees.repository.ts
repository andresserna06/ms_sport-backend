export const MATCH_PREVIOUS_ATTENDEES_REPOSITORY = Symbol(
  'MATCH_PREVIOUS_ATTENDEES_REPOSITORY',
);

export interface MatchPreviousAttendeesRepository {
  findActiveFanUserIdsByPreviousTeamMatches(
    currentMatchId: number,
    teamIds: number[],
  ): Promise<number[]>;
}
