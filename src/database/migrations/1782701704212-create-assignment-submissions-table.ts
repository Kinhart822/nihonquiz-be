import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAssignmentSubmissionsTable1782701704212 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assignment_submissions',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'assignment_id', type: 'int' },
          { name: 'student_id', type: 'int' },
          { name: 'content', type: 'text', isNullable: true },
          { name: 'score', type: 'int', isNullable: true },
          { name: 'feedback', type: 'text', isNullable: true },
          { name: 'graded_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['assignment_id'],
            referencedTableName: 'assignments',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            columnNames: ['student_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assignment_submissions');
  }
}
