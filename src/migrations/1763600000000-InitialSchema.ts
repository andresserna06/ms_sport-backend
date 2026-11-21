import { MigrationInterface, QueryRunner } from 'typeorm';

// Baseline: tables that were created by `synchronize: true` before migrations
// were adopted (teams, tournaments, phases, matches).
//
// It uses CREATE TABLE IF NOT EXISTS, so it is safe to run both on a clean
// database (creates them) and on a database that already has them (no-op).
export class InitialSchema1763600000000 implements MigrationInterface {
  name = 'InitialSchema1763600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`teams\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(120) NOT NULL,
        \`city\` varchar(100) NOT NULL,
        \`contact_email\` varchar(150) NOT NULL,
        \`founded_year\` int NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`UQ_teams_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`tournaments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(120) NOT NULL,
        \`start_date\` date NOT NULL,
        \`enrollment_deadline\` date NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`phases\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`phase_order\` int NOT NULL,
        \`phase_type\` varchar(10) NOT NULL,
        INDEX \`IDX_e4ba3b066100a404ef5a7eccea\` (\`phase_type\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`matches\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`scheduled_at\` datetime NOT NULL,
        \`status\` enum ('SCHEDULED', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
        \`home_score\` int NULL,
        \`away_score\` int NULL,
        \`phase_id\` int NOT NULL,
        INDEX \`IDX_matches_phase_id\` (\`phase_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_matches_phase\` FOREIGN KEY (\`phase_id\`)
          REFERENCES \`phases\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  // Intentionally a no-op: reverting the baseline would drop tables that may
  // hold data and that existed before migrations were introduced.
  public async down(): Promise<void> {}
}
