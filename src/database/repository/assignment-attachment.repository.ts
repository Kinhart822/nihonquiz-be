import { AssignmentAttachmentEntity } from '@entities/assignment-attachment.entity';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';

@CustomRepository(AssignmentAttachmentEntity)
export class AssignmentAttachmentRepository extends BaseRepository<AssignmentAttachmentEntity> {}
