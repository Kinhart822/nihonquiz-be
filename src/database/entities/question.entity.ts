import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { PracticeTestEntity } from './practice-test.entity';
import { MiniQuizEntity } from './mini-quiz.entity';
import { AnswerEntity } from './answer.entity';
import { QuestionType } from '@constants/question.constant';

@Entity('questions')
export class QuestionEntity extends BaseEntity {
  @Column({ name: 'practice_test_id', type: 'int', nullable: true })
  practiceTestId!: number | null;

  @Column({ name: 'mini_quiz_id', type: 'int', nullable: true })
  miniQuizId!: number | null;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  type!: QuestionType;

  @Column({ name: 'score', type: 'int', default: 1 })
  score!: number;

  @Column({ name: 'explanation', type: 'text', nullable: true })
  explanation!: string | null;

  @ManyToOne(() => PracticeTestEntity, (test) => test.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'practice_test_id' })
  practiceTest!: PracticeTestEntity;

  @ManyToOne(() => MiniQuizEntity, (quiz) => quiz.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mini_quiz_id' })
  miniQuiz!: MiniQuizEntity;

  @OneToMany(() => AnswerEntity, (answer) => answer.question, { cascade: true })
  answers!: AnswerEntity[];
}
