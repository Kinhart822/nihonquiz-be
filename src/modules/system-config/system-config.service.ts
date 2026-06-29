import { SystemConfigEntity } from '@entities/system-config.entity';
import { SystemConfigResDto } from '@modules/system-config/dtos/system-config.res.dto';
import { Injectable } from '@nestjs/common';
import { SystemConfigRepository } from '@repositories/system-config.repository';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';
import { SystemConfigFilterDto } from './dtos/system-config.req.dto';

@Injectable()
export class SystemConfigService {
  constructor(private readonly systemConfigRepo: SystemConfigRepository) {}

  // ==================== VALIDATION ====================
  /**
   * Validate key
   */
  private async validateKey(key: string): Promise<SystemConfigEntity> {
    const config = await this.systemConfigRepo
      .createQueryBuilder('config')
      .where('config.key ILIKE :key', { key: `%${key}%` })
      .getOne();
    if (!config) {
      throw new httpNotFound(
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.message,
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.code,
      );
    }
    return config;
  }

  /**
   * Map system config to response DTO
   */
  private mapSystemConfigToResponse(
    systemConfig: SystemConfigEntity,
  ): SystemConfigResDto {
    return plainToInstance(SystemConfigResDto, systemConfig, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET INFO ====================
  async getConfig(key: string): Promise<SystemConfigResDto> {
    const config = await this.validateKey(key);
    return this.mapSystemConfigToResponse(config);
  }

  // ==================== GET LIST ====================
  async getSystemConfigs(
    filterDto: SystemConfigFilterDto,
  ): Promise<PageDto<SystemConfigResDto>> {
    const { entities, total } =
      await this.systemConfigRepo.getSystemConfigsWithFilters(filterDto);

    const mappedItems = entities.map((systemConfig) => {
      return this.mapSystemConfigToResponse(systemConfig);
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== CREATE ====================
  async createSystemConfig(key: string, value: any) {
    const config = await this.systemConfigRepo
      .createQueryBuilder('config')
      .where('config.key ILIKE :key', { key: `%${key}%` })
      .getOne();
    if (config) {
      throw new httpBadRequest(
        httpErrors.SYSTEM_CONFIG_ALREADY_EXISTED.message,
        httpErrors.SYSTEM_CONFIG_ALREADY_EXISTED.code,
      );
    }
    return this.systemConfigRepo.createEntity({
      key,
      value,
    });
  }

  // ==================== UPDATE ====================
  async updateSystemConfig(key: string, value: any) {
    const config = await this.validateKey(key);
    if (!config) {
      throw new httpNotFound(
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.message,
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.code,
      );
    }
    return this.systemConfigRepo.updateEntity(config, { value });
  }

  // ==================== DELETE ====================
  async deleteSystemConfig(key: string) {
    const config = await this.validateKey(key);
    if (!config) {
      throw new httpNotFound(
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.message,
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.code,
      );
    }
    return this.systemConfigRepo.deleteEntitiesByCondition({ key: config.key });
  }
}
