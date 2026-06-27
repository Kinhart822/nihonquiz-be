import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClassSchedulesTable1782241974005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."class_schedules_day_of_week_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'class_schedules',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'class_id', type: 'int' },
          {
            name: 'day_of_week',
            type: 'enum',
            enumName: 'class_schedules_day_of_week_enum',
          },
          { name: 'start_time', type: 'varchar', length: '5' },
          { name: 'end_time', type: 'varchar', length: '5' },
          {
            name: 'room_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['class_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'classes',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('class_schedules');
    await queryRunner.query(
      `DROP TYPE "public"."class_schedules_day_of_week_enum"`,
    );
  }
}
