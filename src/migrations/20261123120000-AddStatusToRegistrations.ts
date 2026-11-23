import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToRegistrations20261123120000 implements MigrationInterface {
  name = 'AddStatusToRegistrations20261123120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('registrations');
    if (!table) return;

    if (!table.findColumnByName('status')) {
      await queryRunner.addColumn(
        'registrations',
        new TableColumn({
          name: 'status',
          type: 'enum',
          enum: ['CONFIRMED', 'WITHDRAWN'],
          default: "'CONFIRMED'",
          isNullable: false,
        }),
      );
    }

    if (!table.findColumnByName('withdrawn_at')) {
      await queryRunner.addColumn(
        'registrations',
        new TableColumn({
          name: 'withdrawn_at',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(
      "UPDATE `registrations` SET `status` = 'CONFIRMED' WHERE `status` IS NULL OR `status` = ''",
    );
  }

  public async down(): Promise<void> {}
}
