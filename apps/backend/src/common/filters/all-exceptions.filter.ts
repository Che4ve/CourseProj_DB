import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const path = request?.url ?? '';
    const method = request?.method ?? 'UNKNOWN';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (responseBody && typeof responseBody === 'object') {
        const responseMessage = (responseBody as { message?: unknown }).message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join('; ');
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        }
      }
    } else if (exception instanceof Error) {
      message = 'Unexpected error';
    }

    const logPrefix = `${method} ${path} ${status}`;
    if (exception instanceof Error) {
      this.logger.error(`${logPrefix} ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`${logPrefix} ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
