import { Order } from '@constants/pagination.constant';
import { AccountHistoryFilterDto } from '@modules/admin/dto/admin.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { AccountHistoryEntity } from '@entities/account-history.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(AccountHistoryEntity)
export class AccountHistoryRepository extends BaseRepository<AccountHistoryEntity> {
  async getAccountHistoryListByFilter(
    filterDto: AccountHistoryFilterDto,
    userId?: number,
  ): Promise<{ entities: AccountHistoryEntity[]; total: number }> {
    const { type, status, direction } = filterDto;
    const queryBuilder = this.createQueryBuilder('history');

    if (userId) {
      queryBuilder.andWhere('history.userId = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('history.type ILIKE :type', { type: `%${type}%` });
    }

    if (status) {
      queryBuilder.andWhere('history.status ILIKE :status', {
        status: `%${status}%`,
      });
    }

    if (filterDto.keyword) {
      queryBuilder.andWhere('history.reason ILIKE :keyword', {
        keyword: `%${filterDto.keyword}%`,
      });
    }

    queryBuilder.orderBy('history.createdAt', direction || Order.DESC);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
