import { HttpException } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
  ) {
    super({ error: { code, message } }, status);
  }
}
