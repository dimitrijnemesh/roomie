import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiException } from '../exceptions/api.exception';

function firstLeaf(error: ValidationError): ValidationError {
  return error.constraints || !error.children?.length ? error : firstLeaf(error.children[0]);
}

const CODE_BY_FIELD: Record<string, string> = {
  email: 'EMAIL_NOT_STUDENT',
  password: 'WEAK_PASSWORD',
  name: 'INVALID_NAME',
  code: 'CODE_INVALID',
};

export const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  stopAtFirstError: true,
  exceptionFactory: (errors) => {
    const first = errors[0] && firstLeaf(errors[0]);
    const message = Object.values(first?.constraints ?? {})[0] ?? 'Невірні дані';
    return new ApiException(400, CODE_BY_FIELD[errors[0]?.property] ?? 'VALIDATION_ERROR', message);
  },
});
