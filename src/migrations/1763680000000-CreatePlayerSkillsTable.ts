import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
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

    await queryRunner.createIndex(
      'player_skills',
      new TableIndex({
        isUnique: true,
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

    await queryRunner.query(
      'ALTER TABLE `player_skills` ADD CONSTRAINT `CHK_player_skills_level_range` CHECK (level IS NULL OR (level >= 1 AND level <= 5))',
    );

    await queryRunner.createForeignKeys('player_skills', [
      new TableForeignKey({
        name: 'FK_1ec09bc2eca330ad10927d3ea37',
        columnNames: ['player_id'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_2646438b8d39b999ce786003e6d',
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
