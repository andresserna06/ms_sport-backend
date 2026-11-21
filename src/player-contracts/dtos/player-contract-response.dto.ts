export class ContractPlayerSummaryDto {
  id!: number;
  userId!: number;
  document!: string;
  position!: string | null;
  jerseyNumber!: number | null;
  active!: boolean;
}

export class ContractTeamSummaryDto {
  id!: number;
  name!: string;
  city!: string;
  active!: boolean;
}

export class PlayerContractResponseDto {
  id!: number;
  playerId!: number;
  teamId!: number;
  startDate!: string;
  endDate!: string | null;
  current!: boolean;
}

export class TeamPlayerContractResponseDto {
  id!: number;
  playerId!: number;
  startDate!: string;
  endDate!: string | null;
  current!: boolean;
  player!: ContractPlayerSummaryDto;
}

export class PlayerTeamContractResponseDto {
  id!: number;
  teamId!: number;
  startDate!: string;
  endDate!: string | null;
  current!: boolean;
  team!: ContractTeamSummaryDto;
}
