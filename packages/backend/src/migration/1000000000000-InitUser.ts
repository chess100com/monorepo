import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUser1000000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR NOT NULL UNIQUE,
        "username" VARCHAR NOT NULL,
        "username_unique" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "updated" TIMESTAMP NOT NULL DEFAULT now(),
        "lastLogin" TIMESTAMP DEFAULT NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
