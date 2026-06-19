import {
  MessageAttachmentStatus,
  MessageAttachmentType,
} from '@constants/user.constant';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { MessageEntity } from './message.entity';

@Entity('message_attachments')
export class MessageAttachmentEntity extends BaseEntity {
  @Column({ name: 'message_id', type: 'int', nullable: false })
  messageId!: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: MessageAttachmentType,
  })
  type!: MessageAttachmentType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: MessageAttachmentStatus,
  })
  status!: MessageAttachmentStatus;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name!: string;

  @Column({ name: 'url', type: 'varchar', nullable: true })
  url!: string;

  @Column({ name: 'size', type: 'int', nullable: true })
  size!: number;

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration!: number;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType!: string;

  @ManyToOne(() => MessageEntity, (message) => message.attachments)
  @JoinColumn({ name: 'message_id' })
  message!: MessageEntity;
}
