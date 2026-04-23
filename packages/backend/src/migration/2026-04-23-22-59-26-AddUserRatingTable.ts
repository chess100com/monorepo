import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRatingTable1000000000006 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_rating" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "gameType" VARCHAR NOT NULL,
        "rating" INTEGER NOT NULL DEFAULT 1500,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "updated" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_rating_user_type" UNIQUE ("userId", "gameType")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_rating_user" ON "user_rating" ("userId")`);
    // Carry forward any existing per-user rating into the Heirs bucket so
    // players don't silently reset to 1500. Heirs is the only variant in MVP.
    await queryRunner.query(`
      INSERT INTO "user_rating" ("userId", "gameType", "rating")
      SELECT "id", 'heirs', "rating" FROM "user"
    `);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "rating"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "rating" INTEGER NOT NULL DEFAULT 1500`);
    await queryRunner.query(`
      UPDATE "user" u
      SET "rating" = ur."rating"
      FROM "user_rating" ur
      WHERE ur."userId" = u."id" AND ur."gameType" = 'heirs'
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_rating_user"`);
    await queryRunner.query(`DROP TABLE "user_rating"`);
  }
}
