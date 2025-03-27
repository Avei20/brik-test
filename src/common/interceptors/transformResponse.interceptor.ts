import {
  ExecutionContext,
  Injectable,
  NestInterceptor,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ISuccessResponse } from '../interfaces/response.interface';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ISuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ISuccessResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data) => ({
        message: 'Success',
        statusCode: response.statusCode,
        data: data,
      })),
      catchError((error) => {
        if (error instanceof HttpException) {
          const errorResponse = error.getResponse() as { message?: string } | string;
          const statusCode = error.getStatus();
          const message = typeof errorResponse === 'string' ? errorResponse : errorResponse.message || 'Error occurred';

          return throwError(() => new HttpException(
            {
              statusCode,
              message,
              error: error.name,
            },
            statusCode,
          ));
        }

        return throwError(() => new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
            error: 'Internal Server Error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ));
      }),
    );
  }
}
