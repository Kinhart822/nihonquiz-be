import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { AssignmentSubmissionAttachmentEntity } from './assignment-submission-attachment.entity';
import { AssignmentEntity } from './assignment.entity';
import { UserEntity } from './user.entity';

@Entity('assignment_submissions')
export class AssignmentSubmissionEntity extends BaseEntity {
  @Column({ name: 'assignment_id', type: 'int' })
  assignmentId!: number;

  @ManyToOne(() => AssignmentEntity, (assignment) => assignment.submissions)
  @JoinColumn({ name: 'assignment_id' })
  assignment!: AssignmentEntity;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @ManyToOne(() => UserEntity, (user) => user.assignmentSubmissions)
  @JoinColumn({ name: 'student_id' })
  student!: UserEntity;

  @Column({ name: 'content', type: 'text', nullable: true })
  content!: string | null;

  @OneToMany(
    () => AssignmentSubmissionAttachmentEntity,
    (attachment) => attachment.submission,
  )
  attachments!: AssignmentSubmissionAttachmentEntity[];

  @Column({ name: 'score', type: 'int', nullable: true })
  score!: number | null;

  @Column({ name: 'feedback', type: 'text', nullable: true })
  feedback!: string | null;

  @Column({ name: 'graded_at', type: 'timestamp', nullable: true })
  gradedAt!: Date | null;
}
