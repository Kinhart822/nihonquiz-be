import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { MiniQuizEntity } from '../entities/mini-quiz.entity';
import { BaseRepository } from './base.repository';

import { MiniQuizFilterDto } from '@modules/mini-quiz/dtos/mini-quiz.req.dto';

@CustomRepository(MiniQuizEntity)
export class MiniQuizRepository extends BaseRepository<MiniQuizEntity> {
  async getMiniQuizzesByLessonWithFilters(
    lessonId: number,
    filterDto: MiniQuizFilterDto,
  ): Promise<{ entities: MiniQuizEntity[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('quiz');
    queryBuilder.where('quiz.lessonId = :lessonId', { lessonId });

    if (filterDto.keyword) {
      queryBuilder.andWhere('quiz.title ILIKE :keyword', {
        keyword: `%${filterDto.keyword}%`,
      });
    }

    queryBuilder
      .orderBy(`quiz.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
