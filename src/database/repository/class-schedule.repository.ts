import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { ClassScheduleEntity } from '../entities/class-schedule.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(ClassScheduleEntity)
export class ClassScheduleRepository extends BaseRepository<ClassScheduleEntity> {}
