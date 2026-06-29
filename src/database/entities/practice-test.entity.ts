import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { QuestionEntity } from './question.entity';
import { TestAttemptEntity } from './test-attempt.entity';

@Entity('practice_tests')
export class PracticeTestEntity extends BaseEntity {
  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'time_limit', type: 'int', comment: 'Time limit in minutes' })
  timeLimit!: number;

  @Column({ name: 'jlpt_level', type: 'varchar', length: 10, nullable: true })
  jlptLevel!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => QuestionEntity, (question) => question.practiceTest)
  questions!: QuestionEntity[];

  @OneToMany(() => TestAttemptEntity, (attempt) => attempt.practiceTest)
  attempts!: TestAttemptEntity[];
}
