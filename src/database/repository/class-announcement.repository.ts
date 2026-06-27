import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { ClassAnnouncementEntity } from '../entities/class-announcement.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(ClassAnnouncementEntity)
export class ClassAnnouncementRepository extends BaseRepository<ClassAnnouncementEntity> {}
