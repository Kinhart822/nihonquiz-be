import {
  MessageAttachmentStatus,
  MessageAttachmentType,
  MessageStatus,
  MessageType,
} from '@constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

export class ReplyToMessageDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  content!: string;

  @ApiProperty()
  @Expose()
  type!: MessageType;

  @ApiProperty()
  @Expose()
  senderParticipantId!: number;
}

export class MessageAttachmentResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  messageId!: number;

  @ApiProperty()
  @Expose()
  type!: MessageAttachmentType;

  @ApiProperty()
  @Expose()
  status!: MessageAttachmentStatus;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty()
  @Expose()
  url!: string;

  @ApiProperty()
  @Expose()
  size!: number;

  @ApiProperty()
  @Expose()
  duration!: number;

  @ApiProperty()
  @Expose()
  mimeType!: string;

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
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  deletedAt!: string;
}

export class MessagePinResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  conversationId!: number;

  @ApiProperty()
  @Expose()
  messageId!: number;

  @ApiProperty()
  @Expose()
  pinnedByParticipantId!: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  pinnedAt!: string;

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
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  deletedAt!: string;
}

export class MessageResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  conversationId!: number;

  @ApiProperty()
  @Expose()
  senderParticipantId!: number;

  @ApiProperty()
  @Expose()
  sequence!: number;

  @ApiProperty()
  @Expose()
  content!: string;

  @ApiProperty()
  @Expose()
  type!: MessageType;

  @ApiProperty()
  @Expose()
  @ValidateNested()
  @Type(() => ReplyToMessageDto)
  replyToMessage!: ReplyToMessageDto;

  @ApiProperty()
  @Expose()
  status!: MessageStatus;

  @ApiProperty()
  @Expose()
  isEdited!: boolean;

  @ApiProperty()
  @Expose()
  editedAt!: Date;

  @ApiProperty({ type: () => MessageAttachmentResDto, isArray: true })
  @Expose()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentResDto)
  attachments!: MessageAttachmentResDto[];

  @ApiProperty({ type: () => MessagePinResDto, isArray: true })
  @Expose()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MessagePinResDto)
  pins!: MessagePinResDto[];

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
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  deletedAt!: string;
}
