import { IsBoolean, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class DiscoverSsoDto {
  @IsString()
  domain!: string;
}

export class CreateSsoConnectionDto {
  @IsString()
  orgId!: string;

  @IsString()
  domain!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  metadataUrl?: string;

  @IsOptional()
  @IsString()
  metadataXml?: string;

  @IsOptional()
  @IsObject()
  attributeMapping?: Record<string, string>;
}

export class UpdateSsoConnectionDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  metadataUrl?: string;

  @IsOptional()
  @IsString()
  metadataXml?: string;

  @IsOptional()
  @IsObject()
  attributeMapping?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
