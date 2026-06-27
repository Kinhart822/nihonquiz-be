import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateGrammarsTable1782241974008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'grammars',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'lesson_id', type: 'int' },
          { name: 'structure', type: 'varchar', length: '255' },
          { name: 'meaning', type: 'text' },
          { name: 'explanation', type: 'text', isNullable: true },
          { name: 'example', type: 'text', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['lesson_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'lessons',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('grammars');
  }
}
