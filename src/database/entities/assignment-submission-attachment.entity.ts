import {
  AssignmentAttachmentStatus,
  AssignmentAttachmentType,
} from '@constants/user.constant';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { AssignmentSubmissionEntity } from './assignment-submission.entity';

@Entity('assignment_submission_attachments')
export class AssignmentSubmissionAttachmentEntity extends BaseEntity {
  @Column({ name: 'submission_id', type: 'int', nullable: false })
  submissionId!: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: AssignmentAttachmentType,
  })
  type!: AssignmentAttachmentType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AssignmentAttachmentStatus,
  })
  status!: AssignmentAttachmentStatus;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name!: string;

  @Column({ name: 'url', type: 'varchar', nullable: true })
  url!: string;

  @Column({ name: 'size', type: 'int', nullable: true })
  size!: number;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType!: string;

  @ManyToOne(
    () => AssignmentSubmissionEntity,
    (submission) => submission.attachments,
  )
  @JoinColumn({ name: 'submission_id' })
  submission!: AssignmentSubmissionEntity;
}
