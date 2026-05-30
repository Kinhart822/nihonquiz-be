import { getVariableName } from '@utils/util';
import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  isNumber,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import {
  ToArray,
  ToBoolean,
  ToLowerCase,
  ToUpperCase,
  Trim,
} from './transform.decorator';

interface StringFieldOptions {
  minLength?: number;
  maxLength?: number;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  number?: boolean;
}

interface NumberFieldOptions {
  each?: boolean;
  minimum?: number;
  maximum?: number;
  int?: boolean;
  isPositive?: boolean;
}

export function initDecoratorField(
  options: ApiPropertyOptions & Partial<{ expose: boolean }>,
  decorators: PropertyDecorator[],
) {
  if (options?.expose) {
    decorators.push(Expose());
  }

  if (options?.required === false) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty());
  }

  return applyDecorators(...decorators);
}

export function NumberField(
  options: ApiPropertyOptions & NumberFieldOptions = {},
): PropertyDecorator {
  const decorators = [Type(() => Number)];

  const { each, int, minimum, maximum, isPositive } = options;

  if (each) {
    decorators.push(ToArray());
  }

  if (int) {
    decorators.push(IsInt({ each }));
  } else {
    decorators.push(IsNumber({}, { each }));
  }

  if (minimum && isNumber(minimum)) {
    decorators.push(Min(minimum, { each }));
  }

  if (maximum && isNumber(maximum)) {
    decorators.push(Max(maximum, { each }));
  }

  if (isPositive) {
    decorators.push(IsPositive({ each }));
  }

  return initDecoratorField(options, decorators);
}

export function NumberFieldOption(
  options: ApiPropertyOptions & NumberFieldOptions = {},
): PropertyDecorator {
  return NumberField({ ...options });
}

export function StringField(
  options: ApiPropertyOptions & StringFieldOptions = {},
): PropertyDecorator {
  const decorators = [IsNotEmpty(), Trim()];
  const { minLength, maxLength, toLowerCase, toUpperCase, number } = options;

  if (minLength) {
    decorators.push(MinLength(minLength));
  }

  if (maxLength) {
    decorators.push(MaxLength(maxLength));
  }

  if (toLowerCase) {
    decorators.push(ToLowerCase());
  }

  if (toUpperCase) {
    decorators.push(ToUpperCase());
  }

  if (number) {
    decorators.push(IsNumberString());
  } else {
    decorators.push(IsString());
  }

  return initDecoratorField(options, decorators);
}

export function StringFieldOption(
  options: Omit<ApiPropertyOptions, 'type'> & StringFieldOptions = {},
): PropertyDecorator {
  return StringField({ ...options, required: false });
}

export function BooleanField(
  options: ApiPropertyOptions & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
  const decorators = [IsBoolean(), ToBoolean()];

  if (options?.swagger !== false) {
    decorators.push(ApiProperty({ type: Boolean, ...options }));
  }

  return initDecoratorField(options, decorators);
}

export function BooleanFieldOption(
  options: Omit<ApiPropertyOptions, 'type'> &
    Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
  return BooleanField({ ...options, required: false });
}

export function EnumField<TEnum>(
  getEnum: () => TEnum,
  options: ApiPropertyOptions &
    Partial<{
      each: boolean;
      swagger: boolean;
      enumNumber: boolean;
    }> = {},
): PropertyDecorator {
  const enumValue = getEnum() as any;
  const decorators = [IsEnum(enumValue)];
  let description: string;

  if (options?.enumNumber) {
    const enumObject = Object.values(enumValue).filter(
      (x) => typeof x === 'string',
    );
    description = Object.values(enumObject)
      .map((key) => key + ': ' + enumValue[key as any])
      .join(', ');
    decorators.push(Type(() => Number));
  } else {
    description = Object.values(enumValue)
      .map((key) => key)
      .join(', ');
  }

  if (options?.swagger !== false) {
    options = { ...options, description };
    decorators.push(
      ApiProperty({
        enumName: getVariableName(getEnum),
        ...options,
      }),
    );
  }

  if (options.each) {
    decorators.push(ToArray());
  }

  return initDecoratorField(options, decorators);
}

export function EnumFieldOptional<TEnum>(
  getEnum: () => TEnum,
  options: Omit<ApiPropertyOptions, 'type' | 'required' | 'enum' | 'enumName'> &
    Partial<{ each: boolean; swagger: boolean; enumNumber: boolean }> = {},
): PropertyDecorator {
  return EnumField(getEnum, { ...options, required: false });
}

export function IsNotHaveSpace(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsNotHaveSpace',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return !value.includes(' ');
        },
        defaultMessage(args: ValidationArguments) {
          return args.property + ' must not have space';
        },
      },
    });
  };
}

export function IsUnixTimestamp(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUnixTimestamp',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          // Must be a number and integer
          if (typeof value !== 'number' || !Number.isInteger(value))
            return false;

          // Optional: check reasonable timestamp range (e.g., 1970-01-01 to ~2100)
          return value > 0 && value < 4102444800; // 2100-01-01 unix timestamp
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid unix timestamp`;
        },
      },
    });
  };
}
