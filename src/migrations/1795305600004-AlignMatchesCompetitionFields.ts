import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AlignMatchesCompetitionFields1795305600004 implements MigrationInterface {
  name = 'AlignMatchesCompetitionFields1795305600004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('matches');
    if (!table) return;

    const addCol = async (name: string, column: TableColumn) => {
      const refreshed = await queryRunner.getTable('matches');
      if (!refreshed?.findColumnByName(name)) await queryRunner.addColumn('matches', column);
    };

    await addCol('home_team_id', new TableColumn({ name: 'home_team_id', type: 'int', isNullable: true }));
    await addCol('away_team_id', new TableColumn({ name: 'away_team_id', type: 'int', isNullable: true }));

    const refreshed = await queryRunner.getTable('matches');
    const hasHomeIdx = refreshed?.indices.some((i) => i.columnNames.includes('home_team_id'));
    if (!hasHomeIdx) await queryRunner.createIndex('matches', new TableIndex({ name: 'IDX_matches_home_team_id', columnNames: ['home_team_id'] }));
    const refreshed2 = await queryRunner.getTable('matches');
    const hasAwayIdx = refreshed2?.indices.some((i) => i.columnNames.includes('away_team_id'));
    if (!hasAwayIdx) await queryRunner.createIndex('matches', new TableIndex({ name: 'IDX_matches_away_team_id', columnNames: ['away_team_id'] }));

    const refreshed3 = await queryRunner.getTable('matches');
    const hasHomeFk = refreshed3?.foreignKeys.some((fk) => fk.columnNames.includes('home_team_id') && fk.referencedTableName === 'teams');
    if (!hasHomeFk) await queryRunner.createForeignKey('matches', new TableForeignKey({ name: 'FK_matches_home_team_id', columnNames: ['home_team_id'], referencedTableName: 'teams', referencedColumnNames: ['id'], onDelete: 'RESTRICT' }));
    const refreshed4 = await queryRunner.getTable('matches');
    const hasAwayFk = refreshed4?.foreignKeys.some((fk) => fk.columnNames.includes('away_team_id') && fk.referencedTableName === 'teams');
    if (!hasAwayFk) await queryRunner.createForeignKey('matches', new TableForeignKey({ name: 'FK_matches_away_team_id', columnNames: ['away_team_id'], referencedTableName: 'teams', referencedColumnNames: ['id'], onDelete: 'RESTRICT' }));
  }

  public async down(): Promise<void> {}
}
