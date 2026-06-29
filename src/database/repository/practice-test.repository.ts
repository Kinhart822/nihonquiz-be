import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { PracticeTestEntity } from '../entities/practice-test.entity';
import { BaseRepository } from './base.repository';

import { PracticeTestFilterDto } from '@modules/practice-test/dtos/practice-test.req.dto';

@CustomRepository(PracticeTestEntity)
export class PracticeTestRepository extends BaseRepository<PracticeTestEntity> {
  async getPracticeTestsWithFilters(
    filterDto: PracticeTestFilterDto,
  ): Promise<{ entities: PracticeTestEntity[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('test');

    if (filterDto.keyword) {
      queryBuilder.andWhere('test.title ILIKE :keyword', {
        keyword: `%${filterDto.keyword}%`,
      });
    }

    if (filterDto.jlptLevel) {
      queryBuilder.andWhere('test.jlptLevel = :jlptLevel', {
        jlptLevel: filterDto.jlptLevel,
      });
    }

    queryBuilder
      .orderBy(`test.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
