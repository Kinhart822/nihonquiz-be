import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateMessageAttachmentsTable1781884045009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."message_attachments_type_enum" AS ENUM('IMAGE', 'VIDEO', 'AUDIO', 'FILE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_attachments_status_enum" AS ENUM('SUCCESS', 'FAILED', 'PENDING', 'DELETED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'message_attachments',
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
            name: 'message_id',
            type: 'int',
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'message_attachments_type_enum',
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'message_attachments_status_enum',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'size',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_attachments');
    await queryRunner.query(
      `DROP TYPE "public"."message_attachments_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."message_attachments_type_enum"`,
    );
  }
}
