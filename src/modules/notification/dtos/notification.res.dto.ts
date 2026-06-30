import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@constants/notification.constant';

export class NotificationResDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  isRead!: boolean;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiProperty()
  createdAt!: Date;
}
