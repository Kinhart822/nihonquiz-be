import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { AnswerEntity } from '../entities/answer.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(AnswerEntity)
export class AnswerRepository extends BaseRepository<AnswerEntity> {}
