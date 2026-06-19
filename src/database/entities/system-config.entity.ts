import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Entity('system_configs')
export class SystemConfigEntity extends BaseEntity {
  @Column({ unique: true, type: 'varchar' })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string;
}
