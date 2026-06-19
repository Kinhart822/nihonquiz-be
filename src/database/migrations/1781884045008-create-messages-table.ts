import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMessagesTable1781884045008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."messages_type_enum" AS ENUM('TEXT', 'ATTACHMENT', 'SYSTEM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('SENT', 'FAILED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'messages',
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
            name: 'sender_participant_id',
            type: 'int',
          },
          {
            name: 'sequence',
            type: 'bigint',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'messages_type_enum',
            default: "'TEXT'",
          },
          {
            name: 'reply_to_message_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'messages_status_enum',
            default: "'SENT'",
          },
          {
            name: 'is_edited',
            type: 'boolean',
            default: 'false',
          },
          {
            name: 'edit_count',
            type: 'int',
            default: '0',
          },
          {
            name: 'edited_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_cc401b05ce2f249df5358009fc',
            columnNames: ['conversation_id', 'sequence'],
            isUnique: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['reply_to_message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            columnNames: ['sender_participant_id'],
            referencedTableName: 'participants',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
  }
}
