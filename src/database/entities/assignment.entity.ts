import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ClassEntity } from './class.entity';
import { AssignmentSubmissionEntity } from './assignment-submission.entity';
import { AssignmentAttachmentEntity } from './assignment-attachment.entity';

@Entity('assignments')
export class AssignmentEntity extends BaseEntity {
  @Column({ name: 'title', type: 'varchar' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate!: Date;

  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @Column({ name: 'allow_resubmit', type: 'boolean', default: true })
  allowResubmit!: boolean;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed!: boolean;

  @ManyToOne(() => ClassEntity, (cls) => cls.assignments)
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @OneToMany(
    () => AssignmentSubmissionEntity,
    (submission) => submission.assignment,
  )
  submissions!: AssignmentSubmissionEntity[];

  @OneToMany(
    () => AssignmentAttachmentEntity,
    (attachment) => attachment.assignment,
  )
  attachments!: AssignmentAttachmentEntity[];
}
