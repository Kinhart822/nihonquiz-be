import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SystemConfigModule } from '../modules/system-config/system-config.module';
import { MaintenanceInterceptor } from './maintenance.interceptor';
import { TransformInterceptor } from './transform-response.interceptor';

@Module({
  imports: [SystemConfigModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MaintenanceInterceptor,
    },
  ],
})
export class InterceptorsModule {}
