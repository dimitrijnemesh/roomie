import { HttpException } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
    field?: string,
  ) {
    super({ error: field ? { code, message, field } : { code, message } }, status);
  }
}
