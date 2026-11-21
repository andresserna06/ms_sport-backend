import { MigrationInterface, QueryRunner } from 'typeorm';

// HU-GC-01: a tournament must belong to a sport, can be deactivated and its
// name is unique per sport; phases can point to their tournament.
//
// The migration never deletes or invents data: when a tournament has no sport
// or two tournaments of the same sport share a name, it stops with a message
// that says how to fix it, before changing anything.
export class TournamentsRequireSport1795219200000
  implements MigrationInterface
{
  name = 'TournamentsRequireSport1795219200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total: withoutSport }] = await queryRunner.query(
      'SELECT COUNT(*) AS total FROM `tournaments` WHERE `sport_id` IS NULL',
    );
    if (Number(withoutSport) > 0) {
      throw new Error(
        `${withoutSport} tournament(s) have no sport (sport_id is NULL). ` +
          'Assign a sport to each one (UPDATE tournaments SET sport_id = ... WHERE sport_id IS NULL) ' +
          'or delete them, then run the migration again.',
      );
    }

    const duplicates = await queryRunner.query(
      `SELECT COUNT(*) AS total
         FROM \`tournaments\`
        GROUP BY sport_id, name COLLATE utf8mb4_unicode_ci
       HAVING COUNT(*) > 1`,
    );
    if (duplicates.length > 0) {
      throw new Error(
        `${duplicates.length} tournament name(s) are repeated inside the same sport. ` +
          'Rename or delete the duplicates, then run the migration again.',
      );
    }

    await queryRunner.query(
      'ALTER TABLE `tournaments` MODIFY `sport_id` int NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `tournaments` MODIFY `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `tournaments` ADD `active` tinyint NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX `UQ_tournaments_sport_name` ON `tournaments` (`sport_id`, `name`)',
    );

    await queryRunner.query('ALTER TABLE `phases` ADD `tournament_id` int NULL');
    await queryRunner.query(
      'CREATE INDEX `IDX_phases_tournament_id` ON `phases` (`tournament_id`)',
    );
    await queryRunner.query(`
      ALTER TABLE \`phases\`
        ADD CONSTRAINT \`FK_phases_tournament\` FOREIGN KEY (\`tournament_id\`)
        REFERENCES \`tournaments\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `phases` DROP FOREIGN KEY `FK_phases_tournament`',
    );
    await queryRunner.query('DROP INDEX `IDX_phases_tournament_id` ON `phases`');
    await queryRunner.query('ALTER TABLE `phases` DROP COLUMN `tournament_id`');

    await queryRunner.query(
      'DROP INDEX `UQ_tournaments_sport_name` ON `tournaments`',
    );
    await queryRunner.query('ALTER TABLE `tournaments` DROP COLUMN `active`');
    await queryRunner.query(
      'ALTER TABLE `tournaments` MODIFY `name` varchar(120) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `tournaments` MODIFY `sport_id` int NULL',
    );
  }
}
