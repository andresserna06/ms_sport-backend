import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePlayerContractsTable1763684000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'player_contracts',
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
            name: 'team_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('player_contracts', [
      new TableIndex({
        name: 'IDX_player_contracts_player_id',
        columnNames: ['player_id'],
      }),
      new TableIndex({
        name: 'IDX_player_contracts_team_id',
        columnNames: ['team_id'],
      }),
    ]);

    await queryRunner.query(
      'ALTER TABLE `player_contracts` ADD CONSTRAINT `CHK_player_contracts_date_range` CHECK (end_date IS NULL OR end_date >= start_date)',
    );

    await queryRunner.createForeignKeys('player_contracts', [
      new TableForeignKey({
        name: 'FK_a6a92f80d5b8bee63bd0042c845',
        columnNames: ['player_id'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_3a1be401ee7f250d6ba2dd02c48',
        columnNames: ['team_id'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('player_contracts', true);
  }
}
