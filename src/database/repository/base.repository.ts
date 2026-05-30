import { Injectable, NotFoundException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Injectable()
export class BaseRepository<T extends BaseEntity> extends Repository<T> {
  async getAllEntity(
    relations: string[] = [],
    throwsException = false,
  ): Promise<T[]> {
    const entities = await this.find({ relations: relations as any });

    if (entities.length === 0 && throwsException) {
      throw new NotFoundException('Model not found');
    }

    return entities;
  }

  async getEntityById(
    id: string | number,
    relations: string[] = [],
    throwsException = false,
  ): Promise<T | null> {
    const entity = await this.findOne({
      where: { id } as any,
      relations: relations as any,
    });

    if (!entity && throwsException) {
      throw new NotFoundException('Model not found');
    }

    return entity;
  }

  async createEntity(
    inputs: DeepPartial<T>,
    relations: string[] = [],
  ): Promise<T> {
    const savedEntity = await this.save(inputs);

    // If specific relations are requested, we need to fetch the entity again to load them
    if (relations.length > 0) {
      const foundEntity = await this.getEntityById(savedEntity.id, relations);
      if (foundEntity) {
        return foundEntity;
      }
    }

    return savedEntity;
  }

  async updateEntity(
    entity: T,
    inputs: DeepPartial<T>,
    relations: string[] = [],
  ): Promise<T> {
    await this.update(entity.id, inputs as any);

    const updatedEntity = await this.getEntityById(entity.id, relations);
    if (!updatedEntity) {
      throw new NotFoundException('Model not found after update');
    }

    return updatedEntity;
  }

  async deleteEntityById(id: number | string): Promise<boolean> {
    const result = await this.delete(id);
    return !!result.affected && result.affected > 0;
  }
}
