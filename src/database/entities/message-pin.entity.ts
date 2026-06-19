import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from './message.entity';
import { ParticipantEntity } from './participant.entity';

@Entity('message_pins')
@Index(['conversationId', 'messageId'], { unique: true })
export class MessagePinEntity extends BaseEntity {
  @Column({ name: 'conversation_id', type: 'int', nullable: false })
  conversationId!: number;

  @Column({ name: 'message_id', type: 'int', nullable: false })
  messageId!: number;

  @Column({ name: 'pinned_by_participant_id', type: 'int', nullable: false })
  pinnedByParticipantId!: number;

  @Column({
    name: 'pinned_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  pinnedAt!: Date;

  @ManyToOne(() => ConversationEntity)
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationEntity;

  @ManyToOne(() => MessageEntity)
  @JoinColumn({ name: 'message_id' })
  message!: MessageEntity;

  @ManyToOne(() => ParticipantEntity)
  @JoinColumn({ name: 'pinned_by_participant_id' })
  pinnedByParticipant!: ParticipantEntity;
}
