import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { KanjiEntity } from '../entities/kanji.entity';
import { BaseRepository } from './base.repository';
import { KanjiFilterDto } from '@modules/kanji/dtos/kanji.req.dto';

@CustomRepository(KanjiEntity)
export class KanjiRepository extends BaseRepository<KanjiEntity> {
  async getKanjisWithFilters(lessonId: number, filterDto: KanjiFilterDto) {
    const queryBuilder = this.createQueryBuilder('kanji');

    queryBuilder.where('kanji.lessonId = :lessonId', { lessonId });

    if (filterDto.keyword) {
      queryBuilder.andWhere(
        '(kanji.character ILIKE :keyword OR kanji.onyomi ILIKE :keyword OR kanji.kunyomi ILIKE :keyword OR kanji.meaning ILIKE :keyword)',
        { keyword: `%${filterDto.keyword}%` },
      );
    }

    queryBuilder
      .orderBy(`kanji.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
