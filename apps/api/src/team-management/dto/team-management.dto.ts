import { IsEmail, IsEnum, IsString } from 'class-validator';

export class InviteDto {
  @IsEmail()
  email!: string;
}

export class AcceptInviteDto {
  @IsString()
  invitationId!: string;
}

export class ChangeRoleDto {
  @IsString()
  memberId!: string;

  @IsEnum(['admin', 'member'], { message: 'Role must be admin or member' })
  role!: 'admin' | 'member';
}
