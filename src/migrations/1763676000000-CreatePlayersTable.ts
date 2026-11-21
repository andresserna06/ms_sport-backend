import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePlayersTable1763676000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'players',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'document',
            type: 'varchar',
            length: '30',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '60',
            isNullable: true,
          },
          {
            name: 'jersey_number',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Match the index names TypeORM expects from the entity (avoids schema drift).
    await queryRunner.query(
      'ALTER TABLE `players` RENAME INDEX `UQ_ba3575d2fbe71fab7155366235e` TO `IDX_ba3575d2fbe71fab7155366235`',
    );
    // Match the index names TypeORM expects from the entity (avoids schema drift).
    await queryRunner.query(
      'ALTER TABLE `players` RENAME INDEX `UQ_e9e29de4fbc27a0f2df42ede46c` TO `IDX_e9e29de4fbc27a0f2df42ede46`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('players', true);
  }
}
