import { Order } from '@constants/pagination.constant';
import { AuditLogFilterDto } from '@modules/audit-log/dtos/audit-log.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';
import { AuditLogEntity } from '@entities/audit-log.entity';

@CustomRepository(AuditLogEntity)
export class AuditLogRepository extends BaseRepository<AuditLogEntity> {
  async getAuditLogsWithFilters(
    filterDto: AuditLogFilterDto,
  ): Promise<{ entities: AuditLogEntity[]; total: number }> {
    const { statuses, keyword, startDate, endDate } = filterDto;
    const query = this.createQueryBuilder('audit_log');

    if (statuses) {
      query.andWhere('audit_log.status IN (:...statuses)', { statuses });
    }

    if (keyword) {
      query.andWhere('audit_log.endpoint ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (startDate) {
      query.andWhere('audit_log.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.timestamp <= :endDate', { endDate });
    }

    query.orderBy(`audit_log.createdAt`, filterDto.direction || Order.DESC);
    query.skip(filterDto.skip).take(filterDto.limit);

    const [entities, total] = await query.getManyAndCount();
    return { entities, total };
  }
}
