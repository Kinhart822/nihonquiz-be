import { AssignmentSubmissionAttachmentEntity } from '@entities/assignment-submission-attachment.entity';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';

@CustomRepository(AssignmentSubmissionAttachmentEntity)
export class AssignmentSubmissionAttachmentRepository extends BaseRepository<AssignmentSubmissionAttachmentEntity> {}
