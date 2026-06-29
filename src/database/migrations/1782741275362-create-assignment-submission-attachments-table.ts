import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAssignmentSubmissionAttachmentsTable1782741275362 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assignment_submission_attachments',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'submission_id', type: 'int' },
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
            columnNames: ['submission_id'],
            referencedTableName: 'assignment_submissions',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assignment_submission_attachments');
  }
}
