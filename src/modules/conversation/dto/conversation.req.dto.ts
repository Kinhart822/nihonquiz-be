import { Order } from '@constants/pagination.constant';
import {
  ConversationStatus,
  ConversationType,
  JoinGroupRequestAction,
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
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum MuteValue {
  M15 = '15m',
  H1 = '1h',
  H8 = '8h',
  H24 = '24h',
  FOREVER = 'forever',
  UNMUTE = 'unmute',
}

export class ConversationFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Search by keyword in name, email, username or lastMessagePreview',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @ApiProperty({
    description: 'List of conversation types to filter (DIRECT, GROUP)',
    example: ['DIRECT', 'GROUP'],
    required: false,
    isArray: true,
    enum: ConversationType,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'types array cannot be empty' })
  @IsEnum(ConversationType, { each: true })
  @ToArray()
  readonly types!: ConversationType[];

  @ApiProperty({
    description:
      'List of conversation statuses to filter (ACTIVE, BLOCKED, DELETED)',
    example: ['ACTIVE', 'BLOCKED', 'DELETED'],
    required: false,
    isArray: true,
    enum: ConversationStatus,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'statuses array cannot be empty' })
  @IsEnum(ConversationStatus, { each: true })
  @ToArray()
  readonly statuses!: ConversationStatus[];

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

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Name',
    example: 'Conversation Name',
    required: true,
  })
  name!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Participants must not be empty' })
  @IsInt({ each: true, message: 'Each participant must be an integer' })
  @Transform(({ value }) => {
    const arr = Array.isArray(value) ? value : [value];
    return arr.map(Number);
  })
  @ApiProperty({
    type: [Number],
    description: 'List of participant IDs',
    example: [1, 2, 3],
  })
  participants!: number[];

  @IsOptional()
  @IsEnum(ConversationType)
  @ApiProperty({
    description: 'Conversation type (DIRECT, GROUP)',
    example: ConversationType.DIRECT,
    required: false,
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType = ConversationType.DIRECT;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    description: 'Name',
    example: 'Conversation Name',
    required: false,
  })
  name?: string;

  @IsOptional()
  @IsEnum(ConversationType)
  @ApiProperty({
    description: 'Conversation type (DIRECT, GROUP)',
    example: ConversationType.DIRECT,
    required: false,
    enum: ConversationType,
  })
  type?: ConversationType;
}

export class AddConversationMemberDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'User IDs must not be empty' })
  @IsInt({ each: true, message: 'Each user ID must be an integer' })
  @Transform(({ value }) => {
    const arr = Array.isArray(value) ? value : [value];
    return arr.map(Number);
  })
  @ApiProperty({
    type: [Number],
    description: 'List of user IDs',
    example: [1, 2, 3],
  })
  userIds!: number[];
}
export class RemoveConversationMemberDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Participant IDs must not be empty' })
  @IsInt({ each: true, message: 'Each participant ID must be an integer' })
  @Transform(({ value }) => {
    const arr = Array.isArray(value) ? value : [value];
    return arr.map(Number);
  })
  @ApiProperty({
    type: [Number],
    description: 'List of participant IDs',
    example: [1, 2, 3],
  })
  participantIds!: number[];
}

export class MuteConversationDto {
  @IsEnum(MuteValue)
  @ApiProperty({
    description: 'Mute value (15m, 1h, 8h, 24h, forever, unmute)',
    example: '15m',
    required: true,
    enum: MuteValue,
  })
  muteValue!: MuteValue;
}

export class ChangeOwnerDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Owner Id',
    example: 1,
    required: true,
  })
  ownerId!: number;
}

export class CreateJoinGroupRequestDto {
  @IsInt()
  @ApiProperty({
    type: Number,
    description: 'Conversation Id',
    example: 1,
    required: true,
  })
  conversationId!: number;
}

export class ProcessJoinGroupRequestDto {
  @IsEnum(JoinGroupRequestAction)
  @ApiProperty({
    description: 'Join group request status (ACCEPT, REJECT)',
    example: JoinGroupRequestAction.ACCEPT,
    required: true,
    enum: JoinGroupRequestAction,
  })
  action!: JoinGroupRequestAction;
}
