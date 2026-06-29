import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAssignmentAttachmentsTable1782741275361 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums for attachments
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_attachments_type_enum" AS ENUM('IMAGE', 'VIDEO', 'AUDIO', 'FILE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_attachments_status_enum" AS ENUM('SUCCESS', 'FAILED', 'PENDING', 'DELETED')`,
    );

    // 2. assignment_attachments table
    await queryRunner.createTable(
      new Table({
        name: 'assignment_attachments',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'assignment_id', type: 'int' },
          {
            name: 'type',
            type: 'enum',
            enumName: 'assignment_attachments_type_enum',
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'assignment_attachments_status_enum',
          },
          { name: 'name', type: 'varchar', isNullable: true },
          { name: 'url', type: 'varchar', isNullable: true },
          { name: 'size', type: 'int', isNullable: true },
          { name: 'mime_type', type: 'varchar', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['assignment_id'],
            referencedTableName: 'assignments',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assignment_attachments');
    await queryRunner.query(
      `DROP TYPE "public"."assignment_attachments_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."assignment_attachments_type_enum"`,
    );
  }
}
