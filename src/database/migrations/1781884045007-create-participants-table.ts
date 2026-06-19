import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateParticipantsTable1781884045007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."participants_role_enum" AS ENUM('OWNER', 'MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."participants_status_enum" AS ENUM('PENDING', 'ACTIVE', 'ARCHIVED', 'LEFT', 'KICKED', 'BLOCKED', 'DELETED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'participants',
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
            name: 'conversation_id',
            type: 'int',
          },
          {
            name: 'nickname',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enumName: 'participants_role_enum',
            default: "'MEMBER'",
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'participants_status_enum',
            default: "'ACTIVE'",
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: true,
          },
          {
            name: 'left_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'unread_count',
            type: 'int',
            default: '0',
          },
          {
            name: 'last_read_seq',
            type: 'bigint',
            default: '0',
            isNullable: true,
          },
          {
            name: 'is_muted',
            type: 'boolean',
            default: 'false',
          },
          {
            name: 'mute_until',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_pinned',
            type: 'boolean',
            default: 'false',
          },
          {
            name: 'pinned_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_709250a1408c4f7e62085fbc74',
            columnNames: ['conversation_id', 'user_id'],
            isUnique: true,
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'users',
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
    await queryRunner.dropTable('participants');
    await queryRunner.query(`DROP TYPE "public"."participants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."participants_role_enum"`);
  }
}
