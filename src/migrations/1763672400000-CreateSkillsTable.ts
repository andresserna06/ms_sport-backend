import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSkillsTable1763672400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'skills',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Match the index names TypeORM expects from the entity (avoids schema drift).
    await queryRunner.query(
      'ALTER TABLE `skills` RENAME INDEX `UQ_81f05095507fd84aa2769b4a522` TO `IDX_81f05095507fd84aa2769b4a52`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('skills', true);
  }
}
