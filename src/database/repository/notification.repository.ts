import { NotificationFilterDto } from '../../modules/notification/dtos/notification.req.dto';
import { CustomRepository } from '../../shared/decorators/typeorm.decorator';
import { PageMetaDto } from '../../shared/dtos/page-meta.dto';
import { PageDto } from '../../shared/dtos/page.dto';
import { NotificationEntity } from '../entities/notification.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(NotificationEntity)
export class NotificationRepository extends BaseRepository<NotificationEntity> {
  async getUserNotifications(
    userId: number,
    filter: NotificationFilterDto,
  ): Promise<PageDto<NotificationEntity>> {
    const queryBuilder = this.createQueryBuilder('n');
    queryBuilder.where('n.user_id = :userId', { userId });

    if (filter.isRead !== undefined) {
      queryBuilder.andWhere('n.is_read = :isRead', { isRead: filter.isRead });
    }

    if (filter.type) {
      queryBuilder.andWhere('n.type = :type', { type: filter.type });
    }

    queryBuilder.orderBy('n.created_at', filter.direction);
    queryBuilder.skip(filter.skip).take(filter.limit);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto(filter, itemCount);

    return new PageDto(entities, pageMetaDto);
  }
}
