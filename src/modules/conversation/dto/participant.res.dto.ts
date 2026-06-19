import { ParticipantRole, ParticipantStatus } from '@constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ParticipantResDto {
  @ApiProperty()
  @Expose()
  id!: number;

  @ApiProperty()
  @Expose()
  conversationId!: number;

  @ApiProperty()
  @Expose()
  nickname!: string;

  @ApiProperty()
  @Expose()
  userId!: number;

  @ApiProperty()
  @Expose()
  username!: string;

  @ApiProperty()
  @Expose()
  email!: string;

  @ApiProperty()
  @Expose()
  avatarUrl!: string;

  @ApiProperty()
  @Expose()
  role!: ParticipantRole;

  @ApiProperty()
  @Expose()
  status!: ParticipantStatus;

  @ApiProperty()
  @Expose()
  joinedAt!: Date;

  @ApiProperty()
  @Expose()
  leftAt!: Date;

  @ApiProperty()
  @Expose()
  unreadCount!: number;

  @ApiProperty()
  @Expose()
  lastReadSeq!: number;

  @ApiProperty()
  @Expose()
  isMuted!: boolean;

  @ApiProperty()
  @Expose()
  muteUntil!: Date;

  @ApiProperty()
  @Expose()
  isPinned!: boolean;
}
