import { Module } from '@nestjs/common';
import { SystemConfigRepository } from '@repositories/system-config.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { SystemConfigController } from './system-config.controller';
import { BullModule } from '@nestjs/bullmq';
import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { SystemConfigService } from './system-config.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([SystemConfigRepository]),
    BullModule.registerQueue({
      name: FILE_UPLOAD_QUEUE,
    }),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
