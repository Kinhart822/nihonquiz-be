import { Order } from '@constants/pagination.constant';
import {
  MessageAttachmentStatus,
  MessageAttachmentType,
  MessageStatus,
  MessageType,
} from '@constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import {
  EnumFieldOptional,
  StringFieldOption,
} from '@shared/decorators/field.decorator';
import { ToArray } from '@shared/decorators/transform.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class MessageFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Search by keyword in participant email/username or message content',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @ApiProperty({
    description: 'List of message types to filter (TEXT, ATTACHMENT, SYSTEM)',
    example: ['TEXT', 'ATTACHMENT', 'SYSTEM'],
    required: false,
    isArray: true,
    enum: MessageType,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageType, { each: true })
  @ToArray()
  readonly types: MessageType[];

  @ApiProperty({
    description:
      'List of message attachment types to filter (IMAGE, VIDEO, AUDIO, FILE)',
    example: ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'],
    required: false,
    isArray: true,
    enum: MessageAttachmentType,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageAttachmentType, { each: true })
  @ToArray()
  readonly attachments: MessageAttachmentType[];

  @ApiProperty({
    description: 'List of message statuses to filter (SENT, DELETED, FAILED)',
    example: ['SENT', 'DELETED', 'FAILED'],
    required: false,
    isArray: true,
    enum: MessageStatus,
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsEnum(MessageStatus, { each: true })
  @ToArray()
  readonly statuses: MessageStatus[];

  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;

  @StringFieldOption({ required: false, example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @StringFieldOption({ required: false, example: '2024-01-02T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MessageAttachmentFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by keyword in file name',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @ApiProperty({
    description:
      'List of message attachment statuses to filter (SUCCESS, FAILED, DELETED)',
    example: ['SUCCESS', 'FAILED', 'DELETED'],
    required: false,
    isArray: true,
    enum: MessageAttachmentStatus,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageAttachmentStatus, { each: true })
  @ToArray()
  readonly statuses: MessageAttachmentStatus[];

  @ApiProperty({
    description:
      'List of message attachment types to filter (IMAGE, VIDEO, AUDIO, FILE)',
    example: ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'],
    required: false,
    isArray: true,
    enum: MessageAttachmentType,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageAttachmentType, { each: true })
  @ToArray()
  readonly attachments: MessageAttachmentType[];

  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;

  @StringFieldOption({ required: false, example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @StringFieldOption({ required: false, example: '2024-01-02T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MessagePinFilterDto extends PageOptionsDto {
  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;

  @StringFieldOption({ required: false, example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @StringFieldOption({ required: false, example: '2024-01-02T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MessageContentDto {
  @ApiProperty({
    type: Number,
    description: 'Conversation ID',
    example: 1,
    required: true,
  })
  @IsInt({ message: 'Conversation ID must be an integer' })
  @Transform(({ value }) => Number(value))
  conversationId: number;

  @ApiProperty({
    type: String,
    description: 'Content',
    example: 'Hello',
    required: false,
  })
  @IsOptional()
  @IsString()
  content: string;
}

export class SendMessageDto extends MessageContentDto {
  @IsOptional()
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Reply to message Id',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => Number(value))
  replyToMessageId?: number;
}

export class EditMessageDto extends MessageContentDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Message Id',
    example: 1,
    required: true,
  })
  messageId: number;
}

export class DeleteMessageDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Message Id',
    example: 1,
    required: true,
  })
  messageId: number;
}

export class MarkAsReadDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Conversation Id',
    example: 1,
    required: true,
  })
  conversationId: number;
}

export class PinMessageDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Conversation Id',
    example: 1,
    required: true,
  })
  conversationId: number;

  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Message Id',
    example: 1,
    required: true,
  })
  messageId: number;
}

export class UnpinMessageDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Conversation Id',
    example: 1,
    required: true,
  })
  conversationId: number;

  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Message Id',
    example: 1,
    required: true,
  })
  messageId: number;
}
