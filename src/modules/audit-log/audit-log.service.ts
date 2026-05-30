import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from '@repositories/audit-log.repository';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';
import { AuditLogFilterDto, CreateAuditLogDto } from './dtos/audit-log.req.dto';
import { AuditLogResDto } from './dtos/audit-log.res.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Get paginated list of audit logs
   */
  async getAuditLogs(
    filterDto: AuditLogFilterDto,
  ): Promise<PageDto<AuditLogResDto>> {
    const { entities, total } =
      await this.auditLogRepository.getAuditLogsWithFilters(filterDto);

    const mappedItems = entities.map((auditLog) => {
      return plainToInstance(AuditLogResDto, auditLog, {
        excludeExtraneousValues: true,
      });
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  /**
   * Get audit log info by ID
   */
  async getAuditLogInfo(id: number): Promise<AuditLogResDto> {
    const log = await this.auditLogRepository.findOne({ where: { id } });
    if (!log) {
      httpNotFound(
        httpErrors.AUDIT_LOG_NOT_FOUND.message,
        httpErrors.AUDIT_LOG_NOT_FOUND.code,
      );
    }

    return plainToInstance(AuditLogResDto, log, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Create new audit log
   */
  async createAuditLog(payload: CreateAuditLogDto) {
    try {
      const log = this.auditLogRepository.create(payload as any);
      return await this.auditLogRepository.save(log);
    } catch (err) {
      this.logger.error('Failed to save audit log', (err as Error).stack);
      return null;
    }
  }
}
