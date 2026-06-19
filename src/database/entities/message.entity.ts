import { MessageStatus, MessageType } from '@constants/user.constant';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ConversationEntity } from './conversation.entity';
import { MessageAttachmentEntity } from './message-attachment.entity';
import { MessagePinEntity } from './message-pin.entity';
import { ParticipantEntity } from './participant.entity';

@Entity('messages')
@Index(['conversationId', 'sequence'], { unique: true })
export class MessageEntity extends BaseEntity {
  @Column({ name: 'conversation_id', type: 'int', nullable: false })
  conversationId!: number;

  @Column({ name: 'sender_participant_id', type: 'int', nullable: false })
  senderParticipantId!: number;

  @Column({ name: 'sequence', type: 'bigint', nullable: false })
  sequence!: number;

  @Column({ name: 'content', type: 'text', nullable: true })
  content!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type!: MessageType;

  @Column({ name: 'reply_to_message_id', type: 'int', nullable: true })
  replyToMessageId!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  @Column({
    name: 'is_edited',
    type: 'boolean',
    default: false,
  })
  isEdited!: boolean;

  @Column({
    name: 'edit_count',
    type: 'int',
    default: 0,
  })
  editCount!: number;

  @Column({
    name: 'edited_at',
    type: 'timestamp',
    nullable: true,
  })
  editedAt!: Date;

  @ManyToOne(() => MessageEntity)
  @JoinColumn({ name: 'reply_to_message_id' })
  replyToMessage!: MessageEntity;

  @ManyToOne(() => ParticipantEntity)
  @JoinColumn({ name: 'sender_participant_id' })
  sender!: ParticipantEntity;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationEntity;

  @OneToMany(() => MessageAttachmentEntity, (attachment) => attachment.message)
  attachments!: MessageAttachmentEntity[];

  @OneToMany(() => MessagePinEntity, (pin) => pin.message)
  pins!: MessagePinEntity[];
}
