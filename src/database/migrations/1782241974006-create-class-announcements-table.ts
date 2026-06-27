import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClassAnnouncementsTable1782241974006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'class_announcements',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
          { name: 'class_id', type: 'int' },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'content', type: 'text' },
          { name: 'author_id', type: 'int' },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['class_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'classes',
          }),
          new TableForeignKey({
            columnNames: ['author_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('class_announcements');
  }
}
