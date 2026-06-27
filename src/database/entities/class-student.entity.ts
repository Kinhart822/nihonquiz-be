import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ClassEntity } from './class.entity';
import { UserEntity } from './user.entity';
import { ClassStudentStatus } from '../../constants/class.constant';

@Entity('class_students')
export class ClassStudentEntity extends BaseEntity {
  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ClassStudentStatus,
    default: ClassStudentStatus.ACTIVE,
  })
  status!: ClassStudentStatus;

  @ManyToOne(() => ClassEntity)
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'student_id' })
  student!: UserEntity;
}
