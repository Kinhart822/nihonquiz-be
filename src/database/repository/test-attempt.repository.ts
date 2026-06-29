import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { TestAttemptEntity } from '../entities/test-attempt.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(TestAttemptEntity)
export class TestAttemptRepository extends BaseRepository<TestAttemptEntity> {}
