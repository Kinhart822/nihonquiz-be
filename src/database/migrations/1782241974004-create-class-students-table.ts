import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClassStudentsTable1782241974004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."class_students_status_enum" AS ENUM('ACTIVE', 'REMOVED', 'PENDING')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'class_students',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'class_id', type: 'int' },
          { name: 'student_id', type: 'int' },
          {
            name: 'status',
            type: 'enum',
            enumName: 'class_students_status_enum',
            default: "'ACTIVE'",
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['class_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'classes',
          }),
          new TableForeignKey({
            columnNames: ['student_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('class_students');
    await queryRunner.query(`DROP TYPE "public"."class_students_status_enum"`);
  }
}
