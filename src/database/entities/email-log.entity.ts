import { Column, type DeepPartial, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Entity('email_logs')
export class EmailLogEntity extends BaseEntity {
  constructor(partial?: DeepPartial<EmailLogEntity>) {
    super();
    Object.assign(this, partial);
  }

  @Column({ name: 'from', type: 'varchar', nullable: true })
  fromEmail!: string | null;

  @Column({ name: 'to', type: 'varchar', nullable: true })
  toEmail!: string | null;

  @Column({ name: 'subject', type: 'varchar', nullable: true })
  subject!: string | null;

  @Column({ name: 'template', type: 'varchar', nullable: true })
  template!: string | null;

  @Column({ name: 'context', type: 'text', nullable: true })
  context!: string | null;

  @Column({ name: 'type', type: 'varchar', nullable: true })
  type!: string | null;

  @Column({ name: 'status', type: 'varchar', nullable: true })
  status!: string | null;

  @Column({ name: 'error', type: 'text', nullable: true })
  error!: string | null;
}
