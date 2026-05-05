import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class InviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(['admin', 'member'], {
    message: 'Role must be admin or member',
  })
  role?: 'admin' | 'member';
}

export class AcceptInviteDto {
  @IsString()
  invitationId!: string;
}

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string;
}

export class RenameTeamDto {
  @IsString()
  @MaxLength(100)
  name!: string;
}

export class ChangeRoleDto {
  @IsString()
  memberId!: string;

  @IsEnum(['admin', 'member'], { message: 'Role must be admin or member' })
  role!: 'admin' | 'member';
}
