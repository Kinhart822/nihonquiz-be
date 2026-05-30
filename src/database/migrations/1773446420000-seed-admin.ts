import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdmin1773446420000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const admins = [
      {
        email: 'admin@test.com',
        username: 'admin',
        password:
          '$2b$12$ZdbZrO8qNRgUEe3CppqZV.8kwirnUceM2VevNquekxE2chqmZvRCC', // 123456
        status: 'INACTIVE',
        access_method: 'EMAIL',
        role: 'ADMIN',
      },
      {
        email: 'teacher@test.com',
        username: 'teacher',
        password:
          '$2b$12$ZdbZrO8qNRgUEe3CppqZV.8kwirnUceM2VevNquekxE2chqmZvRCC',
        status: 'INACTIVE',
        access_method: 'EMAIL',
        role: 'TEACHER',
      },
      {
        email: 'student@test.com',
        username: 'student',
        password:
          '$2b$12$ZdbZrO8qNRgUEe3CppqZV.8kwirnUceM2VevNquekxE2chqmZvRCC',
        status: 'INACTIVE',
        access_method: 'EMAIL',
        role: 'STUDENT',
      },
    ];

    for (const admin of admins) {
      await queryRunner.query(
        `INSERT INTO "users" ("email", "username", "password", "status", "access_method", "role") 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          admin.email,
          admin.username,
          admin.password,
          admin.status,
          admin.access_method,
          admin.role,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" IN ('admin1@test.com', 'admin2@test.com')`,
    );
  }
}
