import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { SystemConfigStatus } from '../../constants/system-config.constant';

@Entity('system_configs')
export class SystemConfigEntity extends BaseEntity {
  @Column({ name: 'key', type: 'varchar', unique: true })
  key!: string;

  @Column({ name: 'value', type: 'text' })
  value!: string;

  @Column({ name: 'description', nullable: true, type: 'text' })
  description!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SystemConfigStatus,
    default: SystemConfigStatus.SUCCESS,
  })
  status!: SystemConfigStatus;
}
