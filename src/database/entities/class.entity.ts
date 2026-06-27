import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ClassAnnouncementEntity } from './class-announcement.entity';
import { ClassScheduleEntity } from './class-schedule.entity';
import { ClassStudentEntity } from './class-student.entity';
import { UserEntity } from './user.entity';
import { CourseEntity } from './course.entity';

@Entity('classes')
export class ClassEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'code', type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'teacher_id', type: 'int', nullable: true })
  teacherId!: number | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'teacher_id' })
  teacher!: UserEntity;

  @Column({ name: 'course_id', type: 'int', nullable: true })
  courseId!: number | null;

  @ManyToOne(() => CourseEntity, (course) => course.classes)
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @OneToMany(
    () => ClassStudentEntity,
    (classStudent: ClassStudentEntity) => classStudent.class,
  )
  students!: ClassStudentEntity[];

  @OneToMany(
    () => ClassAnnouncementEntity,
    (announcement: ClassAnnouncementEntity) => announcement.class,
  )
  announcements!: ClassAnnouncementEntity[];

  @OneToMany(
    () => ClassScheduleEntity,
    (schedule: ClassScheduleEntity) => schedule.class,
  )
  schedules!: ClassScheduleEntity[];
}
