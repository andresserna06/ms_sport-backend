import { MigrationInterface, QueryRunner } from 'typeorm';

// Optional crest of a team, stored as an image data URL (base64).
export class AddLogoToTeams1795500000000 implements MigrationInterface {
  name = 'AddLogoToTeams1795500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `teams` ADD `logo` longtext NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `teams` DROP COLUMN `logo`');
  }
}
