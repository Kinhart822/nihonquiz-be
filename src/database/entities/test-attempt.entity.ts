import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { PracticeTestEntity } from './practice-test.entity';
import { MiniQuizEntity } from './mini-quiz.entity';
import { UserEntity } from './user.entity';

@Entity('test_attempts')
export class TestAttemptEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'practice_test_id', type: 'int', nullable: true })
  practiceTestId!: number | null;

  @Column({ name: 'mini_quiz_id', type: 'int', nullable: true })
  miniQuizId!: number | null;

  @Column({ name: 'score', type: 'int', default: 0 })
  score!: number;

  @Column({ name: 'total_score', type: 'int', default: 0 })
  totalScore!: number;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({
    name: 'details',
    type: 'json',
    nullable: true,
    comment: 'Stores submitted answers mapping',
  })
  details!: Record<string, any> | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => PracticeTestEntity, (test) => test.attempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'practice_test_id' })
  practiceTest!: PracticeTestEntity;

  @ManyToOne(() => MiniQuizEntity, (quiz) => quiz.attempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mini_quiz_id' })
  miniQuiz!: MiniQuizEntity;
}
