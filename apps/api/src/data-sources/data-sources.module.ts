import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CredentialCryptoService } from './credential-crypto.service';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { NlSqlService } from '../query/nl-sql.service';
import { QueryExecutionService } from '../query/query-execution.service';

@Module({
  imports: [AuthModule],
  controllers: [DataSourcesController],
  providers: [
    CredentialCryptoService,
    DataSourcesService,
    QueryExecutionService,
    NlSqlService,
  ],
})
export class DataSourcesModule {}
