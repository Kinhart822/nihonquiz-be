import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { VocabularyEntity } from '../entities/vocabulary.entity';
import { BaseRepository } from './base.repository';
import { VocabularyFilterDto } from '@modules/vocabulary/dtos/vocabulary.req.dto';

@CustomRepository(VocabularyEntity)
export class VocabularyRepository extends BaseRepository<VocabularyEntity> {
  async getVocabulariesWithFilters(
    lessonId: number,
    filterDto: VocabularyFilterDto,
  ) {
    const queryBuilder = this.createQueryBuilder('vocabulary');

    queryBuilder.where('vocabulary.lessonId = :lessonId', { lessonId });

    if (filterDto.keyword) {
      queryBuilder.andWhere(
        '(vocabulary.word ILIKE :keyword OR vocabulary.reading ILIKE :keyword OR vocabulary.meaning ILIKE :keyword)',
        { keyword: `%${filterDto.keyword}%` },
      );
    }

    queryBuilder
      .orderBy(`vocabulary.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
