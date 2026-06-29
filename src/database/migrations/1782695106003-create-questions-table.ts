import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateQuestionsTable1782695106003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."questions_type_enum" AS ENUM('MULTIPLE_CHOICE')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'questions',
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
            name: 'content',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'questions_type_enum',
            default: "'MULTIPLE_CHOICE'",
          },
          {
            name: 'score',
            type: 'int',
            default: 1,
          },
          {
            name: 'explanation',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('questions', [
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
    const table = await queryRunner.getTable('questions');
    if (table) {
      const foreignKeys = table.foreignKeys.filter(
        (fk) =>
          fk.columnNames.includes('practice_test_id') ||
          fk.columnNames.includes('mini_quiz_id'),
      );
      await queryRunner.dropForeignKeys('questions', foreignKeys);
    }
    await queryRunner.dropTable('questions');
    await queryRunner.query(`DROP TYPE "public"."questions_type_enum"`);
  }
}
