import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRegistrationsTable20261121150003 implements MigrationInterface {
  name = 'CreateRegistrationsTable20261121150003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('registrations');
    if (!hasTable) {
      await queryRunner.createTable(new Table({
        name: 'registrations',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'team_id', type: 'int', isNullable: false },
          { name: 'tournament_id', type: 'int', isNullable: false },
          { name: 'registered_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }), true);
    }

    const table = await queryRunner.getTable('registrations');
    if (!table) return;

    const hasUnique = table.indices.some((i) => i.isUnique && i.columnNames.length === 2 && i.columnNames.includes('team_id') && i.columnNames.includes('tournament_id'));
    if (!hasUnique) {
      await queryRunner.createIndex('registrations', new TableIndex({ name: 'UQ_registrations_team_tournament', columnNames: ['team_id', 'tournament_id'], isUnique: true }));
    }

    const hasTeamFk = table.foreignKeys.some((fk) => fk.columnNames.includes('team_id') && fk.referencedTableName === 'teams');
    if (!hasTeamFk) {
      await queryRunner.createForeignKey('registrations', new TableForeignKey({ name: 'FK_registrations_team_id', columnNames: ['team_id'], referencedTableName: 'teams', referencedColumnNames: ['id'], onDelete: 'RESTRICT' }));
    }
    const refreshed = await queryRunner.getTable('registrations');
    const hasTournamentFk = refreshed?.foreignKeys.some((fk) => fk.columnNames.includes('tournament_id') && fk.referencedTableName === 'tournaments');
    if (!hasTournamentFk) {
      await queryRunner.createForeignKey('registrations', new TableForeignKey({ name: 'FK_registrations_tournament_id', columnNames: ['tournament_id'], referencedTableName: 'tournaments', referencedColumnNames: ['id'], onDelete: 'RESTRICT' }));
    }
  }

  public async down(): Promise<void> {}
}
