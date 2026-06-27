import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { LessonEntity } from '../entities/lesson.entity';
import { BaseRepository } from './base.repository';

import { LessonFilterDto } from '@modules/lesson/dtos/lesson.req.dto';

@CustomRepository(LessonEntity)
export class LessonRepository extends BaseRepository<LessonEntity> {
  async getLessonsWithFilters(courseId: number, filterDto: LessonFilterDto) {
    const queryBuilder = this.createQueryBuilder('lesson');

    queryBuilder.where('lesson.courseId = :courseId', { courseId });

    if (filterDto.keyword) {
      queryBuilder.andWhere('lesson.name ILIKE :keyword', {
        keyword: `%${filterDto.keyword}%`,
      });
    }

    queryBuilder
      .orderBy(`lesson.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
