import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorFansToUseUserId1795400000000
  implements MigrationInterface
{
  name = 'RefactorFansToUseUserId1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUserId = await queryRunner.hasColumn('fans', 'user_id');
    if (!hasUserId) {
      await queryRunner.query(`ALTER TABLE \`fans\` ADD \`user_id\` int NULL`);
      await queryRunner.query(
        `UPDATE \`fans\` SET \`user_id\` = \`id\` WHERE \`user_id\` IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE \`fans\` MODIFY \`user_id\` int NOT NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`UQ_fans_user_id\` ON \`fans\` (\`user_id\`)`,
      );
    }

    const hasEmail = await queryRunner.hasColumn('fans', 'email');
    if (hasEmail) {
      const table = await queryRunner.getTable('fans');
      const emailIndex = table?.indices.find(
        (idx) => idx.name === 'UQ_fans_email',
      );
      if (emailIndex) {
        await queryRunner.query(
          `DROP INDEX \`UQ_fans_email\` ON \`fans\``,
        );
      }
      await queryRunner.query(`ALTER TABLE \`fans\` DROP COLUMN \`email\``);
    }

    const hasName = await queryRunner.hasColumn('fans', 'name');
    if (hasName) {
      await queryRunner.query(`ALTER TABLE \`fans\` DROP COLUMN \`name\``);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasName = await queryRunner.hasColumn('fans', 'name');
    if (!hasName) {
      await queryRunner.query(
        `ALTER TABLE \`fans\` ADD \`name\` varchar(120) NOT NULL DEFAULT ''`,
      );
    }

    const hasEmail = await queryRunner.hasColumn('fans', 'email');
    if (!hasEmail) {
      await queryRunner.query(
        `ALTER TABLE \`fans\` ADD \`email\` varchar(150) NOT NULL DEFAULT ''`,
      );
      await queryRunner.query(
        `UPDATE \`fans\` SET \`email\` = CONCAT('fan-', \`id\`, '@example.com') WHERE \`email\` = ''`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`UQ_fans_email\` ON \`fans\` (\`email\`)`,
      );
    }

    const hasUserId = await queryRunner.hasColumn('fans', 'user_id');
    if (hasUserId) {
      const table = await queryRunner.getTable('fans');
      const userIdIndex = table?.indices.find(
        (idx) => idx.name === 'UQ_fans_user_id',
      );
      if (userIdIndex) {
        await queryRunner.query(
          `DROP INDEX \`UQ_fans_user_id\` ON \`fans\``,
        );
      }
      await queryRunner.query(`ALTER TABLE \`fans\` DROP COLUMN \`user_id\``);
    }
  }
}
