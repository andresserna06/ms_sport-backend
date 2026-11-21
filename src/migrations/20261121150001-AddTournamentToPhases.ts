import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddTournamentToPhases20261121150001 implements MigrationInterface {
  name = 'AddTournamentToPhases20261121150001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('phases');
    if (!table) return;

    if (!table.findColumnByName('tournament_id')) {
      await queryRunner.addColumn('phases', new TableColumn({ name: 'tournament_id', type: 'int', isNullable: true }));
    }

    const refreshed = await queryRunner.getTable('phases');
    const hasFk = refreshed?.foreignKeys.some((fk) => fk.columnNames.includes('tournament_id') && fk.referencedTableName === 'tournaments');
    if (!hasFk) {
      await queryRunner.createForeignKey('phases', new TableForeignKey({
        name: 'FK_phases_tournament_id',
        columnNames: ['tournament_id'],
        referencedTableName: 'tournaments',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }));
    }
  }

  public async down(): Promise<void> {}
}
