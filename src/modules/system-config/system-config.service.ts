import { SystemConfigEntity } from '@entities/system-config.entity';
import { SystemConfigResDto } from '@modules/system-config/dto/system-config.res.dto';
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
import { SystemConfigFilterDto } from './dto/system-config.req.dto';

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  /**
   * Validate key
   */
  private async validateKey(key: string): Promise<SystemConfigEntity> {
    const config = await this.systemConfigRepository
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

  // ==================== GET SYSTEM CONFIG ====================
  async getConfig(key: string): Promise<SystemConfigResDto> {
    const config = await this.validateKey(key);
    return this.mapSystemConfigToResponse(config);
  }

  // ==================== GET SYSTEM CONFIGS ====================
  async getSystemConfigs(
    filterDto: SystemConfigFilterDto,
  ): Promise<PageDto<SystemConfigResDto>> {
    const { entities, total } =
      await this.systemConfigRepository.getSystemConfigsWithFilters(filterDto);

    const mappedItems = entities.map((systemConfig) => {
      return this.mapSystemConfigToResponse(systemConfig);
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== CREATE SYSTEM CONFIG ====================
  async createSystemConfig(key: string, value: any) {
    const config = await this.systemConfigRepository
      .createQueryBuilder('config')
      .where('config.key ILIKE :key', { key: `%${key}%` })
      .getOne();
    if (config) {
      throw new httpBadRequest(
        httpErrors.SYSTEM_CONFIG_ALREADY_EXISTED.message,
        httpErrors.SYSTEM_CONFIG_ALREADY_EXISTED.code,
      );
    }
    const newConfig = this.systemConfigRepository.create({
      key,
      value,
    });
    return this.systemConfigRepository.save(newConfig);
  }

  // ==================== UPDATE SYSTEM CONFIG ====================
  async updateSystemConfig(key: string, value: any) {
    const config = await this.validateKey(key);
    if (!config) {
      throw new httpNotFound(
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.message,
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.code,
      );
    }
    config.value = value;
    return this.systemConfigRepository.save(config);
  }

  // ==================== DELETE SYSTEM CONFIG ====================
  async deleteSystemConfig(key: string) {
    const config = await this.validateKey(key);
    if (!config) {
      throw new httpNotFound(
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.message,
        httpErrors.SYSTEM_CONFIG_NOT_FOUND.code,
      );
    }
    return this.systemConfigRepository.delete({ key: config.key });
  }
}
