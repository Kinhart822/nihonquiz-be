import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1781884045003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_access_method_enum" AS ENUM('EMAIL', 'GOOGLE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('STUDENT', 'TEACHER', 'ADMIN')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            default: "''",
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'background_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'users_status_enum',
          },
          {
            name: 'access_method',
            type: 'enum',
            enumName: 'users_access_method_enum',
          },
          {
            name: 'google_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enumName: 'users_role_enum',
            default: "'STUDENT'",
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_access_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
