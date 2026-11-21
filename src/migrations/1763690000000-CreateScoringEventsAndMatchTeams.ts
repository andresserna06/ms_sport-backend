import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateScoringEventsAndMatchTeams1763690000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `matches` MODIFY COLUMN `status` enum('SCHEDULED','IN_PROGRESS','FINISHED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED'",
    );

    await queryRunner.addColumns('matches', [
      new TableColumn({
        name: 'home_team_id',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'away_team_id',
        type: 'int',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndices('matches', [
      new TableIndex({
        name: 'IDX_matches_home_team_id',
        columnNames: ['home_team_id'],
      }),
      new TableIndex({
        name: 'IDX_matches_away_team_id',
        columnNames: ['away_team_id'],
      }),
    ]);

    await queryRunner.query(
      'ALTER TABLE `matches` ADD CONSTRAINT `CHK_matches_distinct_teams` CHECK (home_team_id IS NULL OR away_team_id IS NULL OR home_team_id <> away_team_id)',
    );

    await queryRunner.createForeignKeys('matches', [
      new TableForeignKey({
        name: 'FK_bb25f11ea6fa78b344a68923769',
        columnNames: ['home_team_id'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_e457f057d971e464c1ebf6378c5',
        columnNames: ['away_team_id'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'scoring_events',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'match_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'player_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'team_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'minute',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('scoring_events', [
      new TableIndex({
        name: 'IDX_scoring_events_match_id',
        columnNames: ['match_id'],
      }),
      new TableIndex({
        name: 'IDX_scoring_events_player_id',
        columnNames: ['player_id'],
      }),
      new TableIndex({
        name: 'IDX_scoring_events_team_id',
        columnNames: ['team_id'],
      }),
    ]);

    await queryRunner.query(
      'ALTER TABLE `scoring_events` ADD CONSTRAINT `CHK_scoring_events_minute_non_negative` CHECK (minute >= 0)',
    );

    await queryRunner.createForeignKeys('scoring_events', [
      new TableForeignKey({
        name: 'FK_170d58529d9bd1aa61bad965491',
        columnNames: ['match_id'],
        referencedTableName: 'matches',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_c1b4b8509ae3ad7a2d7659b3cc3',
        columnNames: ['player_id'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_e32029e8f5aa300602ca9149827',
        columnNames: ['team_id'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scoring_events', true);
    await queryRunner.query(
      'ALTER TABLE `matches` DROP CHECK `CHK_matches_distinct_teams`',
    );
    await queryRunner.dropForeignKey('matches', 'FK_e457f057d971e464c1ebf6378c5');
    await queryRunner.dropForeignKey('matches', 'FK_bb25f11ea6fa78b344a68923769');
    await queryRunner.dropColumn('matches', 'away_team_id');
    await queryRunner.dropColumn('matches', 'home_team_id');
    await queryRunner.query(
      "ALTER TABLE `matches` MODIFY COLUMN `status` enum('SCHEDULED','FINISHED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED'",
    );
  }
}
