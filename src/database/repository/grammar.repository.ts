import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { GrammarEntity } from '../entities/grammar.entity';
import { BaseRepository } from './base.repository';
import { GrammarFilterDto } from '@modules/grammar/dtos/grammar.req.dto';

@CustomRepository(GrammarEntity)
export class GrammarRepository extends BaseRepository<GrammarEntity> {
  async getGrammarsWithFilters(lessonId: number, filterDto: GrammarFilterDto) {
    const queryBuilder = this.createQueryBuilder('grammar');

    queryBuilder.where('grammar.lessonId = :lessonId', { lessonId });

    if (filterDto.keyword) {
      queryBuilder.andWhere(
        '(grammar.structure ILIKE :keyword OR grammar.meaning ILIKE :keyword)',
        { keyword: `%${filterDto.keyword}%` },
      );
    }

    queryBuilder
      .orderBy(`grammar.${filterDto.orderBy}`, filterDto.direction)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
