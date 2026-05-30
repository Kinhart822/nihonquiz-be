import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PageMetaDto;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  IResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        const res = {
          success: true,
          message: 'success',
        } as IResponse<T>;

        if (response && typeof response === 'object' && response?.data) {
          res.data = response.data;

          if (response?.meta) res.meta = response?.meta;
        } else {
          res.data = response;
        }

        return res;
      }),
    );
  }
}
