import { ClassEntity } from '@entities/class.entity';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';
import { ClassFilterDto } from '@modules/class/dtos/class.req.dto';
import { Order } from '@constants/pagination.constant';

@CustomRepository(ClassEntity)
export class ClassRepository extends BaseRepository<ClassEntity> {
  async getClassesWithFilters(
    teacherId: number | null,
    filterDto: ClassFilterDto,
  ): Promise<{ entities: ClassEntity[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('class');

    if (teacherId !== null) {
      queryBuilder.where('class.teacherId = :teacherId', { teacherId });
    }

    if (filterDto.search) {
      const searchCondition =
        '(class.name LIKE :search OR class.code LIKE :search)';
      if (teacherId !== null) {
        queryBuilder.andWhere(searchCondition, {
          search: `%${filterDto.search}%`,
        });
      } else {
        queryBuilder.where(searchCondition, {
          search: `%${filterDto.search}%`,
        });
      }
    }

    queryBuilder
      .orderBy('class.createdAt', filterDto.direction || Order.DESC)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
