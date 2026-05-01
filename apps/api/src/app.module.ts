import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuditModule } from './audit';
import { AuthModule } from './auth';
import { BootstrapModule } from './bootstrap';
import { DatabaseModule } from './database';
import { SsoModule } from './sso';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    BootstrapModule,
    SsoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
