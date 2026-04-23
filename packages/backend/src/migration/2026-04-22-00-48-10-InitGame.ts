import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitGame1000000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "game" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "whiteUserId" INTEGER NOT NULL REFERENCES "user"("id"),
        "blackUserId" INTEGER NOT NULL REFERENCES "user"("id"),
        "startFen" VARCHAR NOT NULL,
        "moves" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "status" VARCHAR NOT NULL DEFAULT 'ongoing',
        "result" VARCHAR NOT NULL DEFAULT '*',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "finishedAt" TIMESTAMP DEFAULT NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_white" ON "game" ("whiteUserId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_black" ON "game" ("blackUserId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "game"`);
  }
}
