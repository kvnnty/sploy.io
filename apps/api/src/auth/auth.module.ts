import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from './jwt.service';
import { UserResolutionService } from './user-resolution.service';
import { AuthGuard } from './guards/auth.guard';
import { OrgMemberGuard } from './guards/org-member.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [
    JwtService,
    UserResolutionService,
    OrgMemberGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtService, UserResolutionService, OrgMemberGuard],
})
export class AuthModule {}
