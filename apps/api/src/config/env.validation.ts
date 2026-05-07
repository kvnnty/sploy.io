import { plainToInstance, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsNumber()
  @Type(() => Number)
  PORT: number = 8080;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsString()
  CLERK_SECRET_KEY!: string;

  @IsString()
  DATABASE_URL!: string;

  /** Base64-encoded 32-byte key for encrypting warehouse credentials */
  @IsOptional()
  @IsString()
  DATASOURCE_ENCRYPTION_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  MINIO_ENDPOINT?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  MINIO_PORT?: number;

  @IsOptional()
  @IsString()
  MINIO_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  MINIO_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  MINIO_BUCKET?: string;

  @IsOptional()
  @IsString()
  MINIO_USE_SSL?: string;

  @IsOptional()
  @IsString()
  MINIO_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  RESEND_FROM_EMAIL?: string;

  @IsOptional()
  @IsUrl()
  APP_URL?: string;

  @IsOptional()
  @IsString()
  APP_NAME?: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }
  return validated;
}
