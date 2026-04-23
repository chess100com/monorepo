import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRating1000000000004 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        ADD COLUMN "rating" INTEGER NOT NULL DEFAULT 1500
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "rating"`);
  }
}
