import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AuditModule } from './audit';
import { AuthModule } from './auth';
import { BootstrapModule } from './bootstrap';
import { DatabaseModule } from './database';
import { SsoModule } from './sso';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { UserModule } from './user';
import { SessionsModule } from './sessions';
import { ProvidersModule } from './providers';
import { TeamsModule } from './teams';
import { NotificationsModule } from './notifications';
import { StorageModule } from './storage';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuditModule,
    AuthModule,
    BootstrapModule,
    SsoModule,
    DataSourcesModule,
    UserModule,
    SessionsModule,
    ProvidersModule,
    TeamsModule,
    NotificationsModule,
    StorageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
