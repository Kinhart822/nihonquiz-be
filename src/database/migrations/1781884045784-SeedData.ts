import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedData1781884045784 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed users
    const passwordHash = await bcrypt.hash('admin123', 12);

    await queryRunner.query(
      `INSERT INTO "users" ("email", "username", "password", "status", "access_method", "role") 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin@test.com', 'admin', passwordHash, 'ACTIVE', 'EMAIL', 'ADMIN'],
    );

    await queryRunner.query(
      `INSERT INTO "users" ("email", "username", "password", "status", "access_method", "role") 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'teacher@test.com',
        'teacher',
        passwordHash,
        'ACTIVE',
        'EMAIL',
        'TEACHER',
      ],
    );

    await queryRunner.query(
      `INSERT INTO "users" ("email", "username", "password", "status", "access_method", "role") 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'student@test.com',
        'student',
        passwordHash,
        'ACTIVE',
        'EMAIL',
        'STUDENT',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" IN ('admin@test.com', 'teacher@test.com', 'student@test.com')`,
    );
  }
}
