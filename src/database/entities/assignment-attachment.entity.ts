import {
  AssignmentAttachmentStatus,
  AssignmentAttachmentType,
} from '@constants/user.constant';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { AssignmentEntity } from './assignment.entity';

@Entity('assignment_attachments')
export class AssignmentAttachmentEntity extends BaseEntity {
  @Column({ name: 'assignment_id', type: 'int', nullable: false })
  assignmentId!: number;

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

  @ManyToOne(() => AssignmentEntity, (assignment) => assignment.attachments)
  @JoinColumn({ name: 'assignment_id' })
  assignment!: AssignmentEntity;
}
