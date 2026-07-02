import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { BYPASS_MAINTENANCE_KEY } from '@shared/decorators/maintenance.decorator';
import { SystemConfigService } from '../modules/system-config/system-config.service';
import { RoleUser } from '@constants/user.constant';
import {
  httpErrors,
  httpServiceUnavailable,
} from '@shared/exceptions/http-exception';

@Injectable()
export class MaintenanceInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isBypass = this.reflector.getAllAndOverride<boolean>(
      BYPASS_MAINTENANCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isBypass) {
      return next.handle();
    }

    const { isMaintenance } =
      await this.systemConfigService.isMaintenanceMode();

    if (!isMaintenance) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.role === RoleUser.ADMIN) {
      return next.handle();
    }

    throw new httpServiceUnavailable(
      httpErrors.MAINTENANCE_MODE.message,
      httpErrors.MAINTENANCE_MODE.code,
    );
  }
}
