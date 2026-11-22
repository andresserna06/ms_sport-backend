import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddGroupToTeams1795305600002 implements MigrationInterface {
  name = 'AddGroupToTeams1795305600002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('teams');
    if (!table) return;

    if (!table.findColumnByName('group_id')) {
      await queryRunner.addColumn('teams', new TableColumn({ name: 'group_id', type: 'int', isNullable: true }));
    }

    const refreshed = await queryRunner.getTable('teams');
    const hasFk = refreshed?.foreignKeys.some((fk) => fk.columnNames.includes('group_id') && fk.referencedTableName === 'phases');
    if (!hasFk) {
      await queryRunner.createForeignKey('teams', new TableForeignKey({
        name: 'FK_dac3c13839536151455938e66b7',
        columnNames: ['group_id'],
        referencedTableName: 'phases',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }));
    }
  }

  public async down(): Promise<void> {}
}
