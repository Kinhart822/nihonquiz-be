import { Injectable } from '@nestjs/common';
import {
  httpErrors,
  httpNotFound,
} from '../../shared/exceptions/http-exception';
import {
  DeepPartial,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Injectable()
export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  async getAllEntity(relations: FindOptionsRelations<T> = {}): Promise<T[]> {
    return this.find({ relations });
  }

  async getAllEntityOrFail(
    relations: FindOptionsRelations<T> = {},
  ): Promise<T[]> {
    const entities = await this.getAllEntity(relations);

    if (entities.length === 0) {
      throw new httpNotFound(
        `${this.metadata.name} not found`,
        httpErrors.ENTITY_NOT_FOUND.code,
      );
    }

    return entities;
  }

  async getEntityById(
    id: string | number,
    relations: FindOptionsRelations<T> = {},
  ): Promise<T | null> {
    return this.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });
  }

  async getEntityByIdOrFail(
    id: string | number,
    relations: FindOptionsRelations<T> = {},
  ): Promise<T> {
    const entity = await this.getEntityById(id, relations);

    if (!entity) {
      throw new httpNotFound(
        `${this.metadata.name} not found`,
        httpErrors.ENTITY_NOT_FOUND.code,
      );
    }

    return entity;
  }

  async createEntity(
    inputs: DeepPartial<T>,
    relations: FindOptionsRelations<T> = {},
  ): Promise<T> {
    const savedEntity = await this.save(inputs);

    return Object.keys(relations).length > 0
      ? this.getEntityByIdOrFail(savedEntity.id, relations)
      : savedEntity;
  }

  async createEntities(
    inputs: DeepPartial<T>[],
    chunkSize = 1000,
  ): Promise<T[]> {
    if (inputs.length === 0) {
      return [];
    }

    return this.save(inputs, { chunk: chunkSize });
  }

  async bulkInsert(
    inputs: DeepPartial<T>[],
    chunkSize = 1000,
  ): Promise<number> {
    if (inputs.length === 0) {
      return 0;
    }

    let insertedCount = 0;

    for (let i = 0; i < inputs.length; i += chunkSize) {
      const chunk = inputs.slice(i, i + chunkSize);
      const result = await this.insert(chunk as any);

      insertedCount += result.identifiers.length;
    }

    return insertedCount;
  }

  async updateEntity(
    entity: T,
    inputs: DeepPartial<T>,
    relations: FindOptionsRelations<T> = {},
  ): Promise<T> {
    const mergedEntity = this.merge(entity, inputs);
    const savedEntity = await this.save(mergedEntity);

    return Object.keys(relations).length > 0
      ? this.getEntityByIdOrFail(savedEntity.id, relations)
      : savedEntity;
  }

  async updateEntityById(
    id: number | string,
    inputs: DeepPartial<T>,
  ): Promise<boolean> {
    const result = await this.update(id, inputs as any);
    return Number(result.affected) > 0;
  }

  async deleteEntityById(id: number | string): Promise<boolean> {
    const result = await this.delete(id);
    return Number(result.affected) > 0;
  }

  async deleteEntitiesByCondition(
    condition: FindOptionsWhere<T>,
  ): Promise<boolean> {
    const result = await this.delete(condition);
    return Number(result.affected) > 0;
  }
}
