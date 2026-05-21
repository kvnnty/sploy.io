import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AuditModule } from './audit';
import { AuthModule } from './auth';
import { BootstrapModule } from './bootstrap';
import { DatabaseModule } from './database';
import { SsoModule } from './sso';
import { AnalysisModule } from './analysis/analysis.module';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { ImportsModule } from './imports/imports.module';
import { QueryModule } from './query/query.module';
import { UserModule } from './user';
import { SessionsModule } from './sessions';
import { ProvidersModule } from './providers';
import { TeamsModule } from './teams';
import { NotificationsModule } from './notifications';
import { StorageModule } from './storage';
import { BillingModule } from './billing/billing.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    QueryModule,
    AuditModule,
    AuthModule,
    BootstrapModule,
    SsoModule,
    DataSourcesModule,
    AnalysisModule,
    ImportsModule,
    UserModule,
    SessionsModule,
    ProvidersModule,
    TeamsModule,
    NotificationsModule,
    StorageModule,
    BillingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
