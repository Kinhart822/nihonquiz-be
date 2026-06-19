import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMessagePinsTable1781884045010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'message_pins',
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
            name: 'conversation_id',
            type: 'int',
          },
          {
            name: 'message_id',
            type: 'int',
          },
          {
            name: 'pinned_by_participant_id',
            type: 'int',
          },
          {
            name: 'pinned_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_800551ef0448e300ff3eddf307',
            columnNames: ['conversation_id', 'message_id'],
            isUnique: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            columnNames: ['message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            columnNames: ['pinned_by_participant_id'],
            referencedTableName: 'participants',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_pins');
  }
}
