import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameEloColumns1000000000005 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game"
        ADD COLUMN "whiteRatingBefore" INTEGER DEFAULT NULL,
        ADD COLUMN "blackRatingBefore" INTEGER DEFAULT NULL,
        ADD COLUMN "whiteRatingAfter" INTEGER DEFAULT NULL,
        ADD COLUMN "blackRatingAfter" INTEGER DEFAULT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game"
        DROP COLUMN "whiteRatingBefore",
        DROP COLUMN "blackRatingBefore",
        DROP COLUMN "whiteRatingAfter",
        DROP COLUMN "blackRatingAfter"
    `);
  }
}
