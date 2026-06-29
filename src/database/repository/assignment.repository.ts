import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { AssignmentEntity } from '../entities/assignment.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(AssignmentEntity)
export class AssignmentRepository extends BaseRepository<AssignmentEntity> {}
