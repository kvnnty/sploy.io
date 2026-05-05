import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionsModule } from '../sessions/sessions.module';
import { JwtService } from './jwt.service';
import { UserResolutionService } from './user-resolution.service';
import { AuthGuard } from './guards/auth.guard';
import { TeamMemberGuard } from './guards/team-member.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [SessionsModule],
  providers: [
    JwtService,
    UserResolutionService,
    TeamMemberGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtService, UserResolutionService, TeamMemberGuard],
})
export class AuthModule {}
