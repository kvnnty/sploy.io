import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateActionDto {
  @IsUUID()
  analysisRunId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class AskImportDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsOptional()
  @IsString()
  schemaHint?: string;

  @IsOptional()
  @IsString()
  sql?: string;
}

export class SaveSlackWebhookDto {
  @IsString()
  @MinLength(10)
  webhookUrl!: string;
}
