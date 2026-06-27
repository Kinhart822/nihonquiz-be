import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ClassEntity } from './class.entity';
import { LessonEntity } from './lesson.entity';

@Entity('courses')
export class CourseEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'thumbnail', type: 'varchar', length: 500, nullable: true })
  thumbnail!: string | null;

  @OneToMany(() => ClassEntity, (cls) => cls.course)
  classes!: ClassEntity[];

  @OneToMany(() => LessonEntity, (lesson) => lesson.course)
  lessons!: LessonEntity[];
}
