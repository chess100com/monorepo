import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameType1000000000003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game"
        ADD COLUMN "type" VARCHAR NOT NULL DEFAULT 'heirs'
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_type" ON "game" ("type")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_type"`);
    await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "type"`);
  }
}
