import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRegistrationsTable1795305600003 implements MigrationInterface {
  name = 'CreateRegistrationsTable1795305600003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('registrations');
    if (!hasTable) {
      await queryRunner.createTable(new Table({
        name: 'registrations',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'team_id', type: 'int', isNullable: false },
          { name: 'tournament_id', type: 'int', isNullable: false },
          { name: 'registered_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
        ],
      }), true);
    }

    const table = await queryRunner.getTable('registrations');
    if (!table) return;

    const hasUnique = table.indices.some((i) => i.isUnique && i.columnNames.length === 2 && i.columnNames.includes('team_id') && i.columnNames.includes('tournament_id'));
    if (!hasUnique) {
      await queryRunner.createIndex('registrations', new TableIndex({ name: 'IDX_cdd9788a52b2da6cba327ecb47', columnNames: ['team_id', 'tournament_id'], isUnique: true }));
    }

    const hasTeamFk = table.foreignKeys.some((fk) => fk.columnNames.includes('team_id') && fk.referencedTableName === 'teams');
    if (!hasTeamFk) {
      await queryRunner.createForeignKey('registrations', new TableForeignKey({ name: 'FK_7b6436e8a7283fcb9d606ed4bb4', columnNames: ['team_id'], referencedTableName: 'teams', referencedColumnNames: ['id'], onDelete: 'RESTRICT' }));
    }
    const refreshed = await queryRunner.getTable('registrations');
    const hasTournamentFk = refreshed?.foreignKeys.some((fk) => fk.columnNames.includes('tournament_id') && fk.referencedTableName === 'tournaments');
    if (!hasTournamentFk) {
      await queryRunner.createForeignKey('registrations', new TableForeignKey({ name: 'FK_6571f3ceaa2274ac20be44aea6d', columnNames: ['tournament_id'], referencedTableName: 'tournaments', referencedColumnNames: ['id'], onDelete: 'RESTRICT' }));
    }
  }

  public async down(): Promise<void> {}
}
