import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddFinalRoundToPhases20261123130000 implements MigrationInterface {
  name = 'AddFinalRoundToPhases20261123130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('phases');
    if (!table) return;

    if (!table.findColumnByName('final_round')) {
      await queryRunner.addColumn(
        'phases',
        new TableColumn({
          name: 'final_round',
          type: 'enum',
          enum: ['ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL'],
          isNullable: true,
        }),
      );
    }

    const refreshed = await queryRunner.getTable('phases');
    const hasIndex = refreshed?.indices.some((i) => i.name === 'UQ_phases_tournament_final_round');
    if (!hasIndex) {
      await queryRunner.createIndex(
        'phases',
        new TableIndex({
          name: 'UQ_phases_tournament_final_round',
          columnNames: ['tournament_id', 'final_round'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(): Promise<void> {}
}
