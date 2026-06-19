import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Entity('account_history')
export class AccountHistoryEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', nullable: false })
  userId!: number;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason!: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status!: string;

  @Column({ name: 'action_by', type: 'int', nullable: true })
  actionBy!: number;

  @Column({ name: 'type', type: 'varchar', length: 50, nullable: true })
  type!: string;
}
