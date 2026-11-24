import { registerDecorator, ValidationOptions } from 'class-validator';
import { universityByEmail } from '../../config/universities';

export function IsStudentEmail(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStudentEmail',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => typeof value === 'string' && universityByEmail(value) !== undefined,
      },
    });
  };
}
