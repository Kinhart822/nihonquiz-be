import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClassesTable1782241974002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'classes',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'is_active', type: 'boolean', default: 'true' },
          { name: 'teacher_id', type: 'int', isNullable: true },
          { name: 'course_id', type: 'int', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['teacher_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
          }),
          new TableForeignKey({
            columnNames: ['course_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'courses',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('classes');
  }
}
