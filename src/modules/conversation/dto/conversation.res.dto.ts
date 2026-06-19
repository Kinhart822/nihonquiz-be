import {
  ConversationStatus,
  ConversationType,
  MessageType,
} from '@constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ConversationResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty()
  @Expose()
  type!: ConversationType;

  @ApiProperty()
  @Expose()
  ownerId!: number;

  @ApiProperty()
  @Expose()
  avatarUrl!: string;

  @ApiProperty()
  @Expose()
  status!: ConversationStatus;

  @ApiProperty()
  @Expose()
  lastMessageId!: number;

  @ApiProperty()
  @Expose()
  lastMessageSeq!: number;

  @ApiProperty()
  @Expose()
  lastMessagePreview!: string;

  @ApiProperty()
  @Expose()
  lastMessageType!: MessageType;

  @ApiProperty()
  @Expose()
  lastMessageSenderId!: number;

  @ApiProperty()
  @Expose()
  lastMessageAt!: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  createdAt!: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  updatedAt!: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  deletedAt!: string;
}
