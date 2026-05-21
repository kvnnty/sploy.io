import { Global, Module } from '@nestjs/common';
import { AnalysisBriefService } from './analysis-brief.service';
import { NlSqlService } from './nl-sql.service';
import { QueryExecutionService } from './query-execution.service';
import { SchemaDiscoveryService } from './schema-discovery.service';

@Global()
@Module({
  providers: [
    QueryExecutionService,
    SchemaDiscoveryService,
    NlSqlService,
    AnalysisBriefService,
  ],
  exports: [
    QueryExecutionService,
    SchemaDiscoveryService,
    NlSqlService,
    AnalysisBriefService,
  ],
})
export class QueryModule {}
