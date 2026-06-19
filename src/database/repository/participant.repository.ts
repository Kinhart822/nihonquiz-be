import { Order } from '@constants/pagination.constant';
import { ParticipantEntity } from '@entities/participant.entity';
import { ParticipantFilterDto } from '@modules/conversation/dto/participant.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';

@CustomRepository(ParticipantEntity)
export class ParticipantRepository extends BaseRepository<ParticipantEntity> {
  async getParticipantsWithFilters(
    conversationId: number,
    filterDto: ParticipantFilterDto,
  ): Promise<{ entities: ParticipantEntity[]; total: number }> {
    const { keyword, statuses, roles } = filterDto;

    const query = this.createQueryBuilder('participant')
      .leftJoinAndSelect('participant.user', 'user')
      .where('participant.conversationId = :conversationId', {
        conversationId,
      });

    if (keyword) {
      query.andWhere('user.email LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('participant.status IN (:...statuses)', {
        statuses,
      });
    }

    if (roles && roles.length > 0) {
      query.andWhere('participant.role IN (:...roles)', {
        roles,
      });
    }

    query.orderBy(`participant.createdAt`, filterDto.direction || Order.DESC);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();
    return { entities, total };
  }

  async incrementUnreadCount(
    conversationId: number,
    excludeUserId: number,
  ): Promise<void> {
    await this.createQueryBuilder()
      .update(ParticipantEntity)
      .set({ unreadCount: () => 'unread_count + 1' })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('userId != :userId', { userId: excludeUserId })
      .execute();
  }
}
