import { Order } from '@constants/pagination.constant';
import { MessageEntity } from '@entities/message.entity';
import { MessageFilterDto } from '@modules/message/dtos/message.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { normalizeDate } from '@utils/date';
import { BaseRepository } from './base.repository';

@CustomRepository(MessageEntity)
export class MessageRepository extends BaseRepository<MessageEntity> {
  private createFilteredQueryBuilder(filterDto: MessageFilterDto) {
    const { keyword, types, statuses, startDate, endDate, attachments } =
      filterDto;

    const query = this.createQueryBuilder('m')
      .leftJoinAndSelect('m.conversation', 'c')
      .leftJoinAndSelect('c.participants', 'p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('m.attachments', 'ma')
      .leftJoinAndSelect('m.replyToMessage', 'rtm')
      .leftJoinAndSelect('m.pins', 'pins');

    if (startDate) {
      query.andWhere('m.createdAt >= :startDate', {
        startDate: normalizeDate(startDate),
      });
    }

    if (endDate) {
      query.andWhere('m.createdAt <= :endDate', {
        endDate: normalizeDate(endDate),
      });
    }

    if (types && types.length > 0) {
      const filterTypes = [...types].map((t) => t.toString());
      query.andWhere('m.type IN (:...filterTypes)', { filterTypes });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('m.status IN (:...statuses)', { statuses });
    }

    if (attachments && attachments.length > 0) {
      query.andWhere('ma.type IN (:...attachments)', { attachments });
    }

    if (keyword) {
      const searchValue = `%${keyword.trim().toLowerCase()}%`;
      query.andWhere(
        '(m.content ILIKE :keyword OR u.email ILIKE :keyword OR u.username ILIKE :keyword)',
        {
          keyword: searchValue,
        },
      );
    }

    return query;
  }

  async getConversationMessagesWithFilters(
    conversationId: number,
    filterDto: MessageFilterDto,
  ): Promise<{ entities: MessageEntity[]; total: number }> {
    const query = this.createFilteredQueryBuilder(filterDto);
    query.andWhere('m.conversationId = :conversationId', { conversationId });

    query.orderBy(`m.createdAt`, filterDto.direction || Order.DESC);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();
    return { entities, total };
  }

  async countMessagesBySender(
    conversationId: number,
    senderParticipantId: number,
  ): Promise<number> {
    return this.count({
      where: { conversationId, senderParticipantId },
    });
  }
}
