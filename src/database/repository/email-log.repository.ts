import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { EmailLogEntity } from '../entities/email-log.entity';
import { BaseRepository } from './base.repository';

@CustomRepository(EmailLogEntity)
export class EmailLogRepository extends BaseRepository<EmailLogEntity> {}
