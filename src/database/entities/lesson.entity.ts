import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { CourseEntity } from './course.entity';
import { GrammarEntity } from './grammar.entity';
import { VocabularyEntity } from './vocabulary.entity';

@Entity('lessons')
export class LessonEntity extends BaseEntity {
  @Column({ name: 'course_id', type: 'int' })
  courseId!: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'order', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => CourseEntity, (course) => course.lessons)
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @OneToMany(() => VocabularyEntity, (vocab) => vocab.lesson)
  vocabularies!: VocabularyEntity[];

  @OneToMany(() => GrammarEntity, (grammar) => grammar.lesson)
  grammars!: GrammarEntity[];
}
