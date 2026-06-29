import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { AssignmentSubmissionEntity } from '../entities/assignment-submission.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(AssignmentSubmissionEntity)
export class AssignmentSubmissionRepository extends BaseRepository<AssignmentSubmissionEntity> {}
