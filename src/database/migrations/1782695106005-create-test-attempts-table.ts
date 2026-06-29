import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTestAttemptsTable1782695106005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'test_attempts',
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
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'practice_test_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'mini_quiz_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'score',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'details',
            type: 'json',
            isNullable: true,
            comment: 'Stores submitted answers mapping',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('test_attempts', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['practice_test_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'practice_tests',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['mini_quiz_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mini_quizzes',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('test_attempts');
    if (table) {
      const foreignKeys = table.foreignKeys.filter(
        (fk) =>
          fk.columnNames.includes('user_id') ||
          fk.columnNames.includes('practice_test_id') ||
          fk.columnNames.includes('mini_quiz_id'),
      );
      await queryRunner.dropForeignKeys('test_attempts', foreignKeys);
    }
    await queryRunner.dropTable('test_attempts');
  }
}
