import { AuditLogStatus } from '@constants/audit.constant';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Entity('audit_logs')
@Index(['userId'])
export class AuditLogEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', nullable: false })
  userId!: number;

  @Column({ name: 'endpoint', type: 'text', nullable: false })
  endpoint!: string;

  @Column({
    name: 'timestamp',
    type: 'bigint',
    nullable: false,
    default: 'EXTRACT(EPOCH FROM now())::bigint',
  })
  timestamp!: number;

  @Column({ name: 'ip_address', type: 'varchar', length: 15, nullable: true })
  ipAddress!: string;

  @Column({
    name: 'device_info',
    type: 'jsonb',
    nullable: false,
    default: `'{}'`,
  })
  deviceInfo!: { browser: any; os: any; device: any };

  @Column({ name: 'geolocation', type: 'text', nullable: true })
  geolocation!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AuditLogStatus,
    enumName: 'audit_log_status_enum',
    nullable: false,
  })
  status!: AuditLogStatus;

  @Column({ name: 'note', type: 'text', nullable: true })
  note!: string;

  @Column({ name: 'details', type: 'jsonb', nullable: false, default: `'{}'` })
  details!: any;
}
