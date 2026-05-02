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
  PORT: number = 3001;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsUrl({ require_tld: false })
  SUPABASE_URL!: string;

  @IsString()
  SUPABASE_JWT_SECRET!: string;

  @IsUrl({ require_tld: false })
  SUPABASE_JWKS_URL!: string;

  @IsString()
  DATABASE_URL!: string;

  /** Base64-encoded 32-byte key for encrypting warehouse credentials */
  @IsOptional()
  @IsString()
  DATASOURCE_ENCRYPTION_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;
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
