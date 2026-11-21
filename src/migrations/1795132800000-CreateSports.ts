import { MigrationInterface, QueryRunner } from 'typeorm';

// HU-GD-01: sports (with its self-relation), team_sports (minimal association
// table, completed in HU-GD-03) and the sport_id FK in tournaments.
// Depends on InitialSchema (teams and tournaments).
//
// Every step checks first whether the object already exists, so it also runs
// on development databases that got these objects from the old `synchronize`.
export class CreateSports1795132800000 implements MigrationInterface {
  name = 'CreateSports1795132800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('sports'))) {
      await queryRunner.query(`
        CREATE TABLE \`sports\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`name\` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`description\` varchar(500) NULL,
          \`active\` tinyint NOT NULL DEFAULT 1,
          \`parent_sport_id\` int NULL,
          UNIQUE INDEX \`UQ_sports_name\` (\`name\`),
          INDEX \`IDX_sports_parent_sport_id\` (\`parent_sport_id\`),
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`FK_sports_parent_sport\` FOREIGN KEY (\`parent_sport_id\`)
            REFERENCES \`sports\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }

    if (!(await queryRunner.hasTable('team_sports'))) {
      await queryRunner.query(`
        CREATE TABLE \`team_sports\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`team_id\` int NOT NULL,
          \`sport_id\` int NOT NULL,
          INDEX \`IDX_team_sports_sport_id\` (\`sport_id\`),
          UNIQUE INDEX \`UQ_team_sports_team_sport\` (\`team_id\`, \`sport_id\`),
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`FK_team_sports_team\` FOREIGN KEY (\`team_id\`)
            REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
          CONSTRAINT \`FK_team_sports_sport\` FOREIGN KEY (\`sport_id\`)
            REFERENCES \`sports\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }

    if (!(await queryRunner.hasColumn('tournaments', 'sport_id'))) {
      await queryRunner.query(
        `ALTER TABLE \`tournaments\` ADD \`sport_id\` int NULL`,
      );
    }

    // The index and the FK are checked on their own: a database synchronized
    // by hand may have the column but not them.
    const tournaments = await queryRunner.getTable('tournaments');
    if (!tournaments?.indices.some((i) => i.name === 'IDX_tournaments_sport_id')) {
      await queryRunner.query(
        `CREATE INDEX \`IDX_tournaments_sport_id\` ON \`tournaments\` (\`sport_id\`)`,
      );
    }
    if (!tournaments?.foreignKeys.some((fk) => fk.columnNames.includes('sport_id'))) {
      await queryRunner.query(`
        ALTER TABLE \`tournaments\`
          ADD CONSTRAINT \`FK_tournaments_sport\` FOREIGN KEY (\`sport_id\`)
          REFERENCES \`sports\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('tournaments', 'sport_id')) {
      const tournaments = await queryRunner.getTable('tournaments');
      const foreignKey = tournaments?.foreignKeys.find((fk) =>
        fk.columnNames.includes('sport_id'),
      );
      if (foreignKey?.name) {
        await queryRunner.query(
          `ALTER TABLE \`tournaments\` DROP FOREIGN KEY \`${foreignKey.name}\``,
        );
      }
      if (tournaments?.indices.some((i) => i.name === 'IDX_tournaments_sport_id')) {
        await queryRunner.query(
          `DROP INDEX \`IDX_tournaments_sport_id\` ON \`tournaments\``,
        );
      }
      await queryRunner.query(
        `ALTER TABLE \`tournaments\` DROP COLUMN \`sport_id\``,
      );
    }

    await queryRunner.query(`DROP TABLE IF EXISTS \`team_sports\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`sports\``);
  }
}
