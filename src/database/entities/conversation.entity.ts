import { Column, Entity, OneToMany } from 'typeorm';

import {
  ConversationStatus,
  ConversationType,
  MessageType,
} from '@constants/user.constant';
import { BaseEntity } from '../../shared/base-entity';
import { MessageEntity } from './message.entity';
import { ParticipantEntity } from './participant.entity';

@Entity('conversations')
export class ConversationEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', nullable: true })
  name!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type!: ConversationType;

  @Column({
    name: 'owner_id',
    type: 'int',
    nullable: true,
  })
  ownerId!: number;

  @Column({
    name: 'avatar_url',
    type: 'varchar',
    nullable: true,
  })
  avatarUrl!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @Column({ name: 'last_message_id', type: 'int', nullable: true })
  lastMessageId!: number;

  @Column({ name: 'last_message_seq', type: 'bigint', nullable: true })
  lastMessageSeq!: number;

  @Column({ name: 'last_message_preview', type: 'text', nullable: true })
  lastMessagePreview!: string;

  @Column({
    name: 'last_message_type',
    type: 'enum',
    enum: MessageType,
    nullable: true,
  })
  lastMessageType!: MessageType;

  @Column({ name: 'last_message_sender_id', type: 'int', nullable: true })
  lastMessageSenderId!: number;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt!: Date;

  @OneToMany(() => ParticipantEntity, (participant) => participant.conversation)
  participants!: ParticipantEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages!: MessageEntity[];
}
