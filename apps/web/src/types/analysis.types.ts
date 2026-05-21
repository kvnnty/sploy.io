export type AskAnalysisBrief = {
  answer: string;
  sqlExplanation: string;
  drivers: { headline: string; detail: string }[];
  recommendedNextStep: string;
  caveats: string[];
  confidence: 'low' | 'medium' | 'high';
};

export type ChartSpec = {
  type: 'line' | 'bar';
  xKey: string;
  yKey: string;
  points: { x: string; y: number }[];
};

export type AnalysisRunSummary = {
  id: string;
  teamId: string;
  userId: string;
  dataSourceId: string | null;
  importId: string | null;
  question: string;
  sql: string;
  rowCount: number;
  truncated: boolean;
  brief: AskAnalysisBrief | null;
  chartSpec: ChartSpec | null;
  createdAt: string;
};

export type AskResponse = {
  sql: string;
  rows: Record<string, unknown>[];
  truncated: boolean;
  brief?: AskAnalysisBrief;
  chartSpec?: ChartSpec | null;
  analysisRunId: string;
  schemaUsed: boolean;
};

export type TeamImportSummary = {
  id: string;
  teamId: string;
  name: string;
  tableName: string;
  columns: { name: string; original: string }[];
  rowCount: number;
  createdAt: string;
};

export type DecisionActionSummary = {
  id: string;
  teamId: string;
  analysisRunId: string;
  title: string;
  body: string;
  status: 'draft' | 'approved' | 'sent';
  deliveryChannel: string;
  sentAt: string | null;
  createdAt: string;
};
