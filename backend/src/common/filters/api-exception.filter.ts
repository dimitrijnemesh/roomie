import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiException } from '../exceptions/api.exception';

const MESSAGES: Record<number, string> = {
  401: 'Потрібно увійти',
  403: 'Немає доступу',
  404: 'Не знайдено',
  429: 'Забагато запитів, спробуй пізніше',
  500: 'Щось пішло не так, спробуй ще раз',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiException) {
      return res.status(exception.getStatus()).json(exception.getResponse());
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = HttpStatus[status] ?? 'ERROR';
      return res.status(status).json({ error: { code, message: MESSAGES[status] ?? exception.message } });
    }

    this.logger.error(exception);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: MESSAGES[500] } });
  }
}
