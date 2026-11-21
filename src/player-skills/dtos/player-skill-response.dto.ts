export class SkillSummaryDto {
  id!: number;
  name!: string;
  description!: string;
}

export class PlayerSummaryDto {
  id!: number;
  userId!: number;
  document!: string;
  position!: string | null;
  jerseyNumber!: number | null;
  active!: boolean;
}

export class PlayerSkillResponseDto {
  id!: number;
  playerId!: number;
  skillId!: number;
  level!: number | null;
  assignedAt!: string;
}

export class PlayerAssignedSkillResponseDto {
  id!: number;
  skillId!: number;
  level!: number | null;
  assignedAt!: string;
  skill!: SkillSummaryDto;
}

export class SkillAssignedPlayerResponseDto {
  id!: number;
  playerId!: number;
  level!: number | null;
  assignedAt!: string;
  player!: PlayerSummaryDto;
}
