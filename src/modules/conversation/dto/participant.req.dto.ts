import { ParticipantRole, ParticipantStatus } from '@constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { ToArray } from '@shared/decorators/transform.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class ParticipantFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by keyword in email or username',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @ApiProperty({
    description: 'List of participant roles to filter (OWNER, MEMBER)',
    example: ['OWNER', 'MEMBER'],
    required: false,
    isArray: true,
    enum: ParticipantRole,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'roles array cannot be empty' })
  @IsEnum(ParticipantRole, { each: true })
  @ToArray()
  readonly roles!: ParticipantRole[];

  @ApiProperty({
    description:
      'List of participant statuses to filter (ACTIVE, ARCHIVED, LEFT, REMOVED, BLOCKED, DELETED)',
    example: ['ACTIVE', 'ARCHIVED', 'LEFT', 'REMOVED', 'BLOCKED', 'DELETED'],
    required: false,
    isArray: true,
    enum: ParticipantStatus,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'statuses array cannot be empty' })
  @IsEnum(ParticipantStatus, { each: true })
  @ToArray()
  readonly statuses!: ParticipantStatus[];
}
