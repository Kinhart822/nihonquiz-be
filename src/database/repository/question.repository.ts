import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { QuestionEntity } from '../entities/question.entity';
import { BaseRepository } from './base.repository';

import { QuestionFilterDto } from '@modules/question-bank/dtos/question.req.dto';

@CustomRepository(QuestionEntity)
export class QuestionRepository extends BaseRepository<QuestionEntity> {
  async getQuestionsWithFilters(
    filterDto: QuestionFilterDto,
  ): Promise<{ entities: QuestionEntity[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('question').leftJoinAndSelect(
      'question.answers',
      'answers',
    );

    if (filterDto.practiceTestId) {
      queryBuilder.andWhere('question.practiceTestId = :practiceTestId', {
        practiceTestId: filterDto.practiceTestId,
      });
    }

    if (filterDto.miniQuizId) {
      queryBuilder.andWhere('question.miniQuizId = :miniQuizId', {
        miniQuizId: filterDto.miniQuizId,
      });
    }

    if (filterDto.keyword) {
      queryBuilder.andWhere('question.content ILIKE :keyword', {
        keyword: `%${filterDto.keyword}%`,
      });
    }

    queryBuilder
      .orderBy(`question.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
