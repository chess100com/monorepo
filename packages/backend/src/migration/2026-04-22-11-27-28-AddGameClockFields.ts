import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameClockFields1000000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game"
        ADD COLUMN "initialTimeMs" INTEGER NOT NULL DEFAULT 600000,
        ADD COLUMN "incrementMs" INTEGER NOT NULL DEFAULT 15000
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game"
        DROP COLUMN "incrementMs",
        DROP COLUMN "initialTimeMs"
    `);
  }
}
