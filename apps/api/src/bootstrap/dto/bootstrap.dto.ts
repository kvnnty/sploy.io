import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class BootstrapDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  orgName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  orgSlug?: string;
}

export class SwitchOrgDto {
  @IsString()
  orgId!: string;
}
