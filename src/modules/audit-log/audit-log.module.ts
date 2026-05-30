import { Global, Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { AuditLogRepository } from '@repositories/audit-log.repository';
import { AuditLogService } from './audit-log.service';

@Global()
@Module({
  imports: [TypeOrmExModule.forCustomRepository([AuditLogRepository])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
