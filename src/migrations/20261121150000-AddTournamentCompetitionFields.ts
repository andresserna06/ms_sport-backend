import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddTournamentCompetitionFields20261121150000 implements MigrationInterface {
  name = 'AddTournamentCompetitionFields20261121150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tournaments');
    if (!table) return;

    if (!table.findColumnByName('sport_id')) {
      await queryRunner.addColumn('tournaments', new TableColumn({ name: 'sport_id', type: 'int', isNullable: true }));
    }
    if (!table.findColumnByName('status')) {
      await queryRunner.addColumn('tournaments', new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['SCHEDULED', 'IN_PROGRESS', 'FINISHED'],
        default: "'SCHEDULED'",
        isNullable: false,
      }));
    }
    if (!table.findColumnByName('active')) {
      await queryRunner.addColumn('tournaments', new TableColumn({ name: 'active', type: 'tinyint', default: 1, isNullable: false }));
    }
  }

  public async down(): Promise<void> {}
}
