import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogsTable1781884045002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_status_enum" AS ENUM('IN_PROGRESS', 'PENDING', 'SUCCESS', 'FAILED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            name: 'endpoint',
            type: 'text',
          },
          {
            name: 'timestamp',
            type: 'bigint',
            default: '(EXTRACT(EPOCH FROM now())::bigint)',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'device_info',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'geolocation',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'audit_log_status_enum',
          },
          {
            name: 'note',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'details',
            type: 'jsonb',
            default: "'{}'",
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_bd2726fd31b35443f2245b93ba',
            columnNames: ['user_id'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
    await queryRunner.query(`DROP TYPE "public"."audit_log_status_enum"`);
  }
}
