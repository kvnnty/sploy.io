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

export type AskAnalysisBrief = {
  answer: string;
  drivers: { headline: string; detail: string }[];
  recommendedNextStep: string;
  caveats: string[];
  confidence: 'low' | 'medium';
};

export type AskDataSourceResponse = {
  sql: string;
  rows: Record<string, unknown>[];
  truncated: boolean;
  brief?: AskAnalysisBrief;
};
