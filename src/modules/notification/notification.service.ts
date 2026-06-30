import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../../database/repository/notification.repository';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import {
  NotificationFilterDto,
  CreateNotificationDto,
} from './dtos/notification.req.dto';
import { NotificationResDto } from './dtos/notification.res.dto';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { PageDto } from '@shared/dtos/page.dto';
import { UserRepository } from '../../database/repository/user.repository';
import { httpNotFound } from '../../shared/exceptions/http-exception';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
    private readonly socketEmitterService: SocketEmitterService,
  ) {}

  // ==================== CREATE NOTIFICATION ====================
  async createNotification(
    params: CreateNotificationDto,
  ): Promise<NotificationResDto> {
    const user = await this.userRepository.findOne({
      where: { id: params.userId },
    });
    if (!user) {
      throw new httpNotFound('User not found');
    }

    const notification = this.notificationRepository.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      metadata: params.metadata,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);
    const resDto = this.mapToResDto(savedNotification);

    // Emit event via socket
    if (user.email) {
      this.socketEmitterService.emitNewNotification(user.email, resDto);
    }

    return resDto;
  }

  // ==================== GET USER NOTIFICATIONS ====================
  async getUserNotifications(
    userId: number,
    filter: NotificationFilterDto,
  ): Promise<PageDto<NotificationResDto>> {
    const result = await this.notificationRepository.getUserNotifications(
      userId,
      filter,
    );

    return new PageDto(
      result.data.map((n) => this.mapToResDto(n)),
      result.meta,
    );
  }

  // ==================== MARK AS READ ====================
  async markAsRead(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new httpNotFound('Notification not found');
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }

  // ==================== MARK ALL AS READ ====================
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  // ==================== MAP TO RES DTO ====================
  private mapToResDto(notification: NotificationEntity): NotificationResDto {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    };
  }
}
