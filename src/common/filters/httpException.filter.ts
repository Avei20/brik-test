import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, // Import Logger
} from '@nestjs/common';
import { Request, Response } from 'express'; // Or from appropriate package if using Fastify
import { IErrorResponse } from '../interfaces/response.interface'; // Adjust path if needed

@Catch() // Catch all exceptions if no specific type is provided
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name); // Initialize logger

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let responseBody: IErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      const errorMessage =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as any).message || 'Error Occurred'; // Default message

      responseBody = {
        statusCode: status,
        message: errorMessage,
        // Extract detailed errors, especially for validation
        errors:
          typeof errorResponse === 'object'
            ? (errorResponse as any).message || errorResponse
            : undefined,
      };
      // Log HttpException details
      this.logger.warn(
        `[${request.method} ${request.url}] HttpException ${status}: ${JSON.stringify(responseBody.errors || errorMessage)}`,
      );
    } else {
      // Uncaught/Internal errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      responseBody = {
        statusCode: status,
        message: 'Internal Server Error',
        errors: [],
      };
      // Log the full unexpected error
      this.logger.error(
        `[${request.method} ${request.url}] Uncaught Exception: ${exception}`,
        (exception as Error).stack,
      );
    }

    response.status(status).json(responseBody);
  }
}
