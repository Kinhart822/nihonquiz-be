import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { QuestionEntity } from './question.entity';

@Entity('answers')
export class AnswerEntity extends BaseEntity {
  @Column({ name: 'question_id', type: 'int' })
  questionId!: number;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect!: boolean;

  @ManyToOne(() => QuestionEntity, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question!: QuestionEntity;
}
