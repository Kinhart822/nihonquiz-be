import { DayOfWeek } from '@constants/class.constant';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ClassEntity } from './class.entity';

@Entity('class_schedules')
export class ClassScheduleEntity extends BaseEntity {
  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek!: DayOfWeek;

  @Column({ name: 'start_time', type: 'varchar', length: 5 }) // Format HH:mm
  startTime!: string;

  @Column({ name: 'end_time', type: 'varchar', length: 5 }) // Format HH:mm
  endTime!: string;

  @Column({ name: 'room_url', type: 'varchar', length: 255, nullable: true })
  roomUrl!: string | null;

  @ManyToOne(() => ClassEntity)
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;
}
