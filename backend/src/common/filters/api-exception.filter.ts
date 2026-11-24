import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiException } from '../exceptions/api.exception';

const MESSAGES: Record<number, string> = {
  401: 'Потрібно увійти',
  403: 'Немає доступу',
  404: 'Не знайдено',
  413: 'Файл завеликий — максимум 5 МБ',
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
      // Never echo internal/parser messages (e.g. JSON syntax errors) to the client.
      const message = MESSAGES[status] ?? (status === 400 ? 'Невірний формат запиту' : 'Щось пішло не так, спробуй ще раз');
      return res.status(status).json({ error: { code, message } });
    }

    // body-parser errors are not HttpExceptions: too large → 413, broken JSON → 400.
    const bodyError = exception as { type?: string; status?: number };
    if (bodyError?.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Забагато даних у запиті' } });
    }

    this.logger.error(exception);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: MESSAGES[500] } });
  }
}
