import { Module } from '@nestjs/common';
import { SystemConfigRepository } from '@repositories/system-config.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Module({
  imports: [TypeOrmExModule.forCustomRepository([SystemConfigRepository])],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
