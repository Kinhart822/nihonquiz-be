import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UAParser } from 'ua-parser-js';

import { AuditLogStatus } from '@constants/audit.constant';
import { AuditLogService } from '@modules/audit-log/audit-log.service';
import { CreateAuditLogDto } from '@modules/audit-log/dtos/audit-log.req.dto';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      forwarded && typeof forwarded === 'string'
        ? forwarded
            .split(',')[0]
            .trim()
            .replace(/^::ffff:/, '')
        : (req.socket?.remoteAddress || '').replace(/^::ffff:/, '');

    // get device info
    const ua = req.headers['user-agent'];
    const parser = new UAParser(ua);
    const result = parser.getResult();
    const deviceInfo = {
      browser: result.browser,
      os: result.os,
      device: result.device,
    };

    const basePayload = {
      endpoint: req.url,
      timestamp: Math.floor(Date.now() / 1000),
      ipAddress,
      deviceInfo,
    };

    return next.handle().pipe(
      tap((response) => {
        try {
          const userId = req.user?.id || response?.userId || 0;
          const payload: CreateAuditLogDto = {
            userId,
            endpoint: basePayload.endpoint,
            timestamp: basePayload.timestamp,
            ipAddress: basePayload.ipAddress,
            deviceInfo: basePayload.deviceInfo,
            status: AuditLogStatus.SUCCESS,
            details: response?.details || {},
            note: response?.message || null,
            geolocation: undefined,
          };

          void this.auditLogService.createAuditLog(payload).catch(() => {});
        } catch (err) {
          this.logger.error(
            'Failed to create audit log on success path',
            err as any,
          );
        }
      }),
      catchError((err) => {
        try {
          const userId = (req.user && (req.user as any).id) || 0;
          const payload: CreateAuditLogDto = {
            userId,
            endpoint: basePayload.endpoint,
            timestamp: basePayload.timestamp,
            ipAddress: basePayload.ipAddress,
            deviceInfo: basePayload.deviceInfo,
            status: AuditLogStatus.FAILED,
            details: {},
          } as CreateAuditLogDto;

          void this.auditLogService.createAuditLog(payload).catch(() => {});
        } catch (innerErr) {
          this.logger.error(
            'Failed to create audit log on error path',
            innerErr as any,
          );
        }

        return throwError(() => err);
      }),
    );
  }
}
