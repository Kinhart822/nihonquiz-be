import { MessageAttachmentEntity } from '@entities/message-attachment.entity';
import { MessageAttachmentFilterDto } from '@modules/message/dto/message.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { normalizeDate } from '@utils/date';
import { BaseRepository } from './base.repository';
import { Order } from '@constants/pagination.constant';

@CustomRepository(MessageAttachmentEntity)
export class MessageAttachmentRepository extends BaseRepository<MessageAttachmentEntity> {
  async getConversationAttachmentsWithFilters(
    conversationId: number,
    filterDto: MessageAttachmentFilterDto,
  ): Promise<{ entities: MessageAttachmentEntity[]; total: number }> {
    const { keyword, statuses, attachments, startDate, endDate } = filterDto;
    const query = this.createQueryBuilder('ma')
      .leftJoinAndSelect('ma.message', 'm')
      .where('m.conversationId = :conversationId', { conversationId });

    if (startDate) {
      query.andWhere('ma.createdAt >= :startDate', {
        startDate: normalizeDate(startDate),
      });
    }

    if (endDate) {
      query.andWhere('ma.createdAt <= :endDate', {
        endDate: normalizeDate(endDate),
      });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('ma.status IN (:...statuses)', { statuses });
    }

    if (attachments && attachments.length > 0) {
      query.andWhere('ma.type IN (:...attachments)', { attachments });
    }

    if (keyword) {
      const searchValue = `%${keyword.trim().toLowerCase()}%`;
      query.andWhere('ma.name ILIKE :keyword', {
        keyword: searchValue,
      });
    }

    query.orderBy('ma.createdAt', filterDto.direction || Order.DESC);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();

    return { entities, total };
  }
}
