import { EEnvironment } from '@constants/env.constant';
import { plainToClass, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsEnum(EEnvironment)
  NODE_ENV!: EEnvironment;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  PORT!: number;

  @IsString()
  @IsOptional()
  GLOBAL_PREFIX!: string;

  @IsString()
  @IsOptional()
  SWAGGER_PATH!: string;

  @IsString()
  DB_HOST!: string;

  @IsNumber()
  @Type(() => Number)
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_DATABASE!: string;

  @IsString()
  JWT_SECRET_KEY!: string;

  @IsString()
  JWT_REFRESH_SECRET_KEY!: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  CHAIN_ID!: number;

  @IsString()
  @IsOptional()
  REDIS_HOST!: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  REDIS_PORT!: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
