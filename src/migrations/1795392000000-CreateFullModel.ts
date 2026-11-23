import { MigrationInterface, QueryRunner } from 'typeorm';

// Completes the class diagram: the entities that did not exist yet (venues,
// seating zones, tickets, bets, balls...) and matches.venue_id. Basic structure
// only: the business rules are added by whoever needs each entity.
export class CreateFullModel1795392000000 implements MigrationInterface {
  name = 'CreateFullModel1795392000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`venues\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(120) NOT NULL,
        \`city\` varchar(100) NOT NULL,
        \`address\` varchar(200) NULL,
        \`capacity\` int NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`parent_venue_id\` int NULL,
        INDEX \`IDX_venues_parent_venue_id\` (\`parent_venue_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_venues_parent_venue\` FOREIGN KEY (\`parent_venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`seating_zones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`venue_id\` int NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`capacity\` int NULL,
        \`price\` decimal(10,2) NOT NULL,
        UNIQUE INDEX \`UQ_seating_zones_venue_name\` (\`venue_id\`, \`name\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_seating_zones_venue\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`tournament_venues\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`tournament_id\` int NOT NULL,
        \`venue_id\` int NOT NULL,
        UNIQUE INDEX \`UQ_tournament_venues_tournament_venue\` (\`tournament_id\`, \`venue_id\`),
        INDEX \`IDX_tournament_venues_venue_id\` (\`venue_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_tournament_venues_tournament\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_tournament_venues_venue\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`fans\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(120) NOT NULL,
        \`email\` varchar(150) NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`UQ_fans_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`fan_teams\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`fan_id\` int NOT NULL,
        \`team_id\` int NOT NULL,
        UNIQUE INDEX \`UQ_fan_teams_fan_team\` (\`fan_id\`, \`team_id\`),
        INDEX \`IDX_fan_teams_team_id\` (\`team_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_fan_teams_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_fan_teams_team\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`payment_methods\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(60) NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`UQ_payment_methods_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`fan_payment_methods\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`fan_id\` int NOT NULL,
        \`payment_method_id\` int NOT NULL,
        \`alias\` varchar(100) NULL,
        UNIQUE INDEX \`UQ_fan_payment_methods_fan_method\` (\`fan_id\`, \`payment_method_id\`),
        INDEX \`IDX_fan_payment_methods_payment_method_id\` (\`payment_method_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_fan_payment_methods_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_fan_payment_methods_payment_method\` FOREIGN KEY (\`payment_method_id\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`tickets\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`fan_id\` int NOT NULL,
        \`match_id\` int NOT NULL,
        \`seating_zone_id\` int NOT NULL,
        \`price\` decimal(10,2) NOT NULL,
        \`purchased_at\` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
        INDEX \`IDX_tickets_fan_id\` (\`fan_id\`),
        INDEX \`IDX_tickets_match_id\` (\`match_id\`),
        INDEX \`IDX_tickets_seating_zone_id\` (\`seating_zone_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_tickets_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_tickets_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_tickets_seating_zone\` FOREIGN KEY (\`seating_zone_id\`) REFERENCES \`seating_zones\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`bets\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`fan_id\` int NOT NULL,
        \`match_id\` int NOT NULL,
        \`fan_payment_method_id\` int NOT NULL,
        \`amount\` decimal(10,2) NOT NULL,
        \`placed_at\` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
        INDEX \`IDX_bets_fan_id\` (\`fan_id\`),
        INDEX \`IDX_bets_match_id\` (\`match_id\`),
        INDEX \`IDX_bets_fan_payment_method_id\` (\`fan_payment_method_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_bets_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_bets_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_bets_fan_payment_method\` FOREIGN KEY (\`fan_payment_method_id\`) REFERENCES \`fan_payment_methods\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`balls\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`match_id\` int NOT NULL,
        \`serial_number\` varchar(60) NOT NULL,
        UNIQUE INDEX \`REL_aee00d6178defd5da2ba9b3424\` (\`match_id\`),
        UNIQUE INDEX \`UQ_balls_serial_number\` (\`serial_number\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_balls_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`spatial_positions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`ball_id\` int NOT NULL,
        \`player_id\` int NOT NULL,
        \`x\` decimal(10,3) NOT NULL,
        \`y\` decimal(10,3) NOT NULL,
        \`recorded_at\` datetime(6) NOT NULL,
        INDEX \`IDX_spatial_positions_ball_id\` (\`ball_id\`),
        INDEX \`IDX_spatial_positions_player_id\` (\`player_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_spatial_positions_ball\` FOREIGN KEY (\`ball_id\`) REFERENCES \`balls\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_spatial_positions_player\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(
      'ALTER TABLE \`matches\` ADD \`venue_id\` int NULL',
    );
    await queryRunner.query(
      'CREATE INDEX \`IDX_matches_venue_id\` ON \`matches\` (\`venue_id\`)',
    );
    await queryRunner.query(`
      ALTER TABLE \`matches\`
        ADD CONSTRAINT \`FK_matches_venue\` FOREIGN KEY (\`venue_id\`)
        REFERENCES \`venues\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_matches_venue\`',
    );
    await queryRunner.query(
      'DROP INDEX \`IDX_matches_venue_id\` ON \`matches\`',
    );
    await queryRunner.query('ALTER TABLE \`matches\` DROP COLUMN \`venue_id\`');
    await queryRunner.query('DROP TABLE \`spatial_positions\`');
    await queryRunner.query('DROP TABLE \`balls\`');
    await queryRunner.query('DROP TABLE \`bets\`');
    await queryRunner.query('DROP TABLE \`tickets\`');
    await queryRunner.query('DROP TABLE \`fan_payment_methods\`');
    await queryRunner.query('DROP TABLE \`payment_methods\`');
    await queryRunner.query('DROP TABLE \`fan_teams\`');
    await queryRunner.query('DROP TABLE \`fans\`');
    await queryRunner.query('DROP TABLE \`tournament_venues\`');
    await queryRunner.query('DROP TABLE \`seating_zones\`');
    await queryRunner.query('DROP TABLE \`venues\`');
  }
}
