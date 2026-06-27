import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { CourseEntity } from '../entities/course.entity';
import { BaseRepository } from './base.repository';

import { CourseFilterDto } from '@modules/course/dtos/course.req.dto';

@CustomRepository(CourseEntity)
export class CourseRepository extends BaseRepository<CourseEntity> {
  async getCoursesWithFilters(filterDto: CourseFilterDto) {
    const queryBuilder = this.createQueryBuilder('course');

    if (filterDto.keyword) {
      queryBuilder.andWhere('course.name ILIKE :keyword', {
        keyword: `%${filterDto.keyword}%`,
      });
    }

    queryBuilder
      .orderBy(`course.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
