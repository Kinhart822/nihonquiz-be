import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateKanjisTable1782241974009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'kanjis',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'character', type: 'varchar', length: '50' },
          { name: 'onyomi', type: 'varchar', length: '255', isNullable: true },
          { name: 'kunyomi', type: 'varchar', length: '255', isNullable: true },
          { name: 'meaning', type: 'text' },
          { name: 'examples', type: 'text', isNullable: true },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('kanjis');
  }
}
