import { MessagePinEntity } from '@entities/message-pin.entity';
import { MessagePinFilterDto } from '@modules/message/dto/message.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { normalizeDate } from '@utils/date';
import { BaseRepository } from './base.repository';
import { Order } from '@constants/pagination.constant';

@CustomRepository(MessagePinEntity)
export class MessagePinRepository extends BaseRepository<MessagePinEntity> {
  async getPinnedMessagesWithFilters(
    conversationId: number,
    filterDto: MessagePinFilterDto,
  ): Promise<{ entities: MessagePinEntity[]; total: number }> {
    const { startDate, endDate } = filterDto;

    const query = this.createQueryBuilder('mp').where(
      'mp.conversationId = :conversationId',
      { conversationId },
    );

    if (startDate) {
      query.andWhere('mp.createdAt >= :startDate', {
        startDate: normalizeDate(startDate),
      });
    }

    if (endDate) {
      query.andWhere('mp.createdAt <= :endDate', {
        endDate: normalizeDate(endDate),
      });
    }

    query.orderBy('mp.pinnedAt', filterDto.direction || Order.DESC);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();
    return { entities, total };
  }
}
