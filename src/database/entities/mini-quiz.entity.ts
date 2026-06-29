import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { LessonEntity } from './lesson.entity';
import { QuestionEntity } from './question.entity';
import { TestAttemptEntity } from './test-attempt.entity';

@Entity('mini_quizzes')
export class MiniQuizEntity extends BaseEntity {
  @Column({ name: 'lesson_id', type: 'int' })
  lessonId!: number;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({
    name: 'time_limit',
    type: 'int',
    comment: 'Time limit in minutes',
    nullable: true,
  })
  timeLimit!: number | null;

  @ManyToOne(() => LessonEntity)
  @JoinColumn({ name: 'lesson_id' })
  lesson!: LessonEntity;

  @OneToMany(() => QuestionEntity, (question) => question.miniQuiz)
  questions!: QuestionEntity[];

  @OneToMany(() => TestAttemptEntity, (attempt) => attempt.miniQuiz)
  attempts!: TestAttemptEntity[];
}
