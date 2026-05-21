export type DataSourceSummary = {
  id: string;
  teamId: string;
  name: string;
  kind: string;
  host: string;
  port: number;
  database: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDataSourceBody = {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export type { AskAnalysisBrief, AskResponse as AskDataSourceResponse, ChartSpec } from './analysis.types';
