import { Order } from '@constants/pagination.constant';
import { ConversationEntity } from '@entities/conversation.entity';
import { ConversationFilterDto } from '@modules/conversation/dto/conversation.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { normalizeDate } from '@utils/date';
import { BaseRepository } from './base.repository';

@CustomRepository(ConversationEntity)
export class ConversationRepository extends BaseRepository<ConversationEntity> {
  private createFilteredQueryBuilder(filterDto: ConversationFilterDto) {
    const { keyword, types, statuses, startDate, endDate } = filterDto;
    const query = this.createQueryBuilder('c');

    if (startDate) {
      query.andWhere('c.createdAt >= :startDate', {
        startDate: normalizeDate(startDate),
      });
    }

    if (endDate) {
      query.andWhere('c.createdAt <= :endDate', {
        endDate: normalizeDate(endDate),
      });
    }

    if (types && types.length > 0) {
      const filterTypes = [...types].map((t) => t.toString());
      query.andWhere('c.type IN (:...filterTypes)', { filterTypes });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('c.status IN (:...statuses)', { statuses });
    }

    if (keyword) {
      const searchValue = `%${keyword.trim().toLowerCase()}%`;
      query.andWhere(
        '(c.name ILIKE :keyword OR c.lastMessagePreview ILIKE :keyword)',
        {
          keyword: searchValue,
        },
      );
    }

    return query;
  }

  async getUserConversationsWithFilters(
    userId: number,
    filterDto: ConversationFilterDto,
  ): Promise<{ entities: ConversationEntity[]; total: number }> {
    const query = this.createFilteredQueryBuilder(filterDto);
    query.leftJoinAndSelect('c.participants', 'p');
    query.andWhere('p.userId = :userId', { userId });

    query.orderBy(`c.lastMessageAt`, filterDto.direction || Order.DESC);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();
    return { entities, total };
  }

  async getConversationsWithFilters(
    filterDto: ConversationFilterDto,
  ): Promise<{ entities: ConversationEntity[]; total: number }> {
    const { direction, orderBy } = filterDto;
    const query = this.createFilteredQueryBuilder(filterDto);

    const allowedOrderBy = [
      'createdAt',
      'updatedAt',
      'deletedAt',
      'lastMessageAt',
      'lastMessageSeq',
      'lastMessagePreview',
      'name',
    ];
    const orderColumn = allowedOrderBy.includes(orderBy)
      ? orderBy
      : 'lastMessageAt';
    const orderDirection = direction ?? Order.DESC;

    query.orderBy(`c.${orderColumn}`, orderDirection);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();
    return { entities, total };
  }
}
