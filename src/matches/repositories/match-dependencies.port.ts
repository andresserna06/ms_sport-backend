export const MATCH_DEPENDENCIES_CHECKER = Symbol('MATCH_DEPENDENCIES_CHECKER');

export interface MatchDependenciesChecker {
  hasScoringEvents(matchId: number): Promise<boolean>;
  hasBlockingDependencies?(matchId: number): Promise<boolean>;
}
