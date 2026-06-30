import { NotificationType } from '@constants/notification.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToArray } from '@shared/decorators/transform.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class NotificationFilterDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'List of notification types to filter ',
    example: [
      NotificationType.SYSTEM_ALERT,
      NotificationType.ASSIGNMENT_CREATED,
    ],
    required: false,
    isArray: true,
    enum: NotificationType,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'types array cannot be empty' })
  @IsEnum(NotificationType, { each: true })
  @ToArray()
  type?: NotificationType;
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty()
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;
}
