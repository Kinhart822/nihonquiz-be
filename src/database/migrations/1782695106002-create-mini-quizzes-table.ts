import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateMiniQuizzesTable1782695106002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mini_quizzes',
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
            name: 'lesson_id',
            type: 'int',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'time_limit',
            type: 'int',
            isNullable: true,
            comment: 'Time limit in minutes',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'mini_quizzes',
      new TableForeignKey({
        columnNames: ['lesson_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lessons',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mini_quizzes');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('lesson_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('mini_quizzes', foreignKey);
    }
    await queryRunner.dropTable('mini_quizzes');
  }
}
