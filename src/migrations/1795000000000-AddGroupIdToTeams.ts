import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddGroupIdToTeams1795000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('teams'))) {
      return;
    }

    let table = await queryRunner.getTable('teams');
    if (!table) {
      return;
    }

    if (!table.findColumnByName('group_id')) {
      await queryRunner.addColumn(
        'teams',
        new TableColumn({
          name: 'group_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    table = await queryRunner.getTable('teams');

    if (
      table &&
      !table.indices.some((index) => index.columnNames.includes('group_id'))
    ) {
      await queryRunner.createIndex(
        'teams',
        new TableIndex({
          name: 'IDX_teams_group_id',
          columnNames: ['group_id'],
        }),
      );
    }

    table = await queryRunner.getTable('teams');

    if (
      table &&
      !table.foreignKeys.some((fk) => fk.columnNames.includes('group_id'))
    ) {
      await queryRunner.createForeignKey(
        'teams',
        new TableForeignKey({
          name: 'FK_teams_group_id',
          columnNames: ['group_id'],
          referencedTableName: 'phases',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('teams'))) {
      return;
    }

    const table = await queryRunner.getTable('teams');
    if (!table) {
      return;
    }

    const foreignKey = table.foreignKeys.find((fk) =>
      fk.columnNames.includes('group_id'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('teams', foreignKey);
    }

    const index = table.indices.find((idx) =>
      idx.columnNames.includes('group_id'),
    );
    if (index) {
      await queryRunner.dropIndex('teams', index);
    }

    if (table.findColumnByName('group_id')) {
      await queryRunner.dropColumn('teams', 'group_id');
    }
  }
}
