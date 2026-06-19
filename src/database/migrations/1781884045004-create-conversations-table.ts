import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateConversationsTable1781884045004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_type_enum" AS ENUM('DIRECT', 'GROUP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_status_enum" AS ENUM('ACTIVE', 'BLOCKED', 'DELETED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_last_message_type_enum" AS ENUM('TEXT', 'ATTACHMENT', 'SYSTEM')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'conversations',
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
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'conversations_type_enum',
            default: "'DIRECT'",
          },
          {
            name: 'owner_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'conversations_status_enum',
            default: "'ACTIVE'",
          },
          {
            name: 'last_message_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'last_message_seq',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'last_message_preview',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_message_type',
            type: 'enum',
            enumName: 'conversations_last_message_type_enum',
            isNullable: true,
          },
          {
            name: 'last_message_sender_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('conversations');
    await queryRunner.query(
      `DROP TYPE "public"."conversations_last_message_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
  }
}
