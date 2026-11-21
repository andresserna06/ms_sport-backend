import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreatePlayerSkillsTable1763680000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'player_skills',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'player_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'skill_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'level',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'assigned_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'player_skills',
      new TableUnique({
        name: 'UQ_player_skills_player_skill',
        columnNames: ['player_id', 'skill_id'],
      }),
    );

    await queryRunner.createIndices('player_skills', [
      new TableIndex({
        name: 'IDX_player_skills_player_id',
        columnNames: ['player_id'],
      }),
      new TableIndex({
        name: 'IDX_player_skills_skill_id',
        columnNames: ['skill_id'],
      }),
    ]);

    await queryRunner.createCheckConstraint(
      'player_skills',
      new TableCheck({
        name: 'CHK_player_skills_level_range',
        expression: 'level IS NULL OR (level >= 1 AND level <= 5)',
      }),
    );

    await queryRunner.createForeignKeys('player_skills', [
      new TableForeignKey({
        name: 'FK_player_skills_player',
        columnNames: ['player_id'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_player_skills_skill',
        columnNames: ['skill_id'],
        referencedTableName: 'skills',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('player_skills', true);
  }
}
