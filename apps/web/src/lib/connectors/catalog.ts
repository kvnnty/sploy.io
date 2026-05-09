export type ConnectorCategoryId =
  | 'recommended'
  | 'databases'
  | 'warehouses'
  | 'analytics'
  | 'finance'
  | 'crm'
  | 'files'
  | 'communication'
  | 'developer'
  | 'custom_apis';

export type ConnectorImplementation = 'postgresql' | 'demo' | 'unavailable';

export type ConnectorSyncStatus =
  | 'disconnected'
  | 'syncing'
  | 'live'
  | 'delayed'
  | 'error'
  | 'needs_reauth'
  | 'agent_indexed';

export type ConnectorDefinition = {
  id: string;
  name: string;
  description: string;
  category: Exclude<ConnectorCategoryId, 'recommended'>;
  /** logo.clearbit.com domain */
  logoDomain: string;
  implementation: ConnectorImplementation;
  /** When set, connecting this demo recommends these connector ids */
  suggests?: string[];
};

export const CONNECTOR_CATEGORY_LABELS: Record<
  Exclude<ConnectorCategoryId, 'recommended'>,
  string
> = {
  databases: 'Databases',
  warehouses: 'Data warehouses',
  analytics: 'Analytics',
  finance: 'Finance',
  crm: 'CRM',
  files: 'Files & documents',
  communication: 'Communication',
  developer: 'Developer tools',
  custom_apis: 'Custom APIs',
};

export const CONNECTOR_CATALOG: ConnectorDefinition[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description:
      'Monitor operational metrics, anomalies, and growth trends directly from production data.',
    category: 'databases',
    logoDomain: 'postgresql.org',
    implementation: 'postgresql',
    suggests: ['mixpanel', 'slack'],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description:
      'Run retention and revenue diagnostics on application databases without exporting CSVs.',
    category: 'databases',
    logoDomain: 'mysql.com',
    implementation: 'demo',
    suggests: ['bigquery'],
  },
  {
    id: 'sqlserver',
    name: 'SQL Server',
    description:
      'Unify ERP, inventory, and sales reporting with governed, read-only analyst access.',
    category: 'databases',
    logoDomain: 'microsoft.com',
    implementation: 'demo',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description:
      'Explore document workloads for product usage signals and customer journey events.',
    category: 'databases',
    logoDomain: 'mongodb.com',
    implementation: 'demo',
  },
  {
    id: 'redis',
    name: 'Redis',
    description:
      'Track cache health, hot keys, and real-time counters that drive operational dashboards.',
    category: 'databases',
    logoDomain: 'redis.io',
    implementation: 'demo',
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    description:
      'Blend marketing, product, and finance datasets in your warehouse for cross-functional answers.',
    category: 'warehouses',
    logoDomain: 'cloud.google.com',
    implementation: 'demo',
    suggests: ['google-sheets'],
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description:
      'Query curated marts with lineage-aware agents that respect roles and row policies.',
    category: 'warehouses',
    logoDomain: 'snowflake.com',
    implementation: 'demo',
    suggests: ['databricks'],
  },
  {
    id: 'databricks',
    name: 'Databricks',
    description:
      'Orchestrate lakehouse jobs, feature stores, and ML outputs into executive-ready briefs.',
    category: 'warehouses',
    logoDomain: 'databricks.com',
    implementation: 'demo',
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description:
      'Turn funnel and cohort signals into autonomous investigations with clear attribution.',
    category: 'analytics',
    logoDomain: 'mixpanel.com',
    implementation: 'demo',
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    description:
      'Explain behavioral shifts with experiment-aware narratives tied to release timelines.',
    category: 'analytics',
    logoDomain: 'amplitude.com',
    implementation: 'demo',
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description:
      'Combine product analytics, session replay context, and flags for full-stack answers.',
    category: 'analytics',
    logoDomain: 'posthog.com',
    implementation: 'demo',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description:
      'Reconcile subscriptions, churn, and cash movements with anomaly-aware revenue reporting.',
    category: 'finance',
    logoDomain: 'stripe.com',
    implementation: 'demo',
    suggests: ['slack', 'quickbooks'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description:
      'Close books faster with autonomous variance checks between billing systems and ledgers.',
    category: 'finance',
    logoDomain: 'intuit.com',
    implementation: 'demo',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description:
      'Connect storefronts to inventory, ads, and support metrics in one analyst workspace.',
    category: 'finance',
    logoDomain: 'shopify.com',
    implementation: 'demo',
    suggests: ['stripe'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description:
      'Pipeline, marketing attribution, and support tickets in unified GTM intelligence.',
    category: 'crm',
    logoDomain: 'hubspot.com',
    implementation: 'demo',
    suggests: ['salesforce', 'notion'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description:
      'Forecast accuracy, stage hygiene, and account risk scoring from live CRM objects.',
    category: 'crm',
    logoDomain: 'salesforce.com',
    implementation: 'demo',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description:
      'Refresh operational models and planning sheets without manual exports or stale tabs.',
    category: 'files',
    logoDomain: 'google.com',
    implementation: 'demo',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description:
      'Analyze documents, spreadsheets, exports, and reports across your workspace.',
    category: 'files',
    logoDomain: 'google.com',
    implementation: 'demo',
  },
  {
    id: 's3',
    name: 'Amazon S3',
    description:
      'Inventory parquet, logs, and exports in buckets with schema-on-read governance.',
    category: 'files',
    logoDomain: 'aws.amazon.com',
    implementation: 'demo',
  },
  {
    id: 'notion',
    name: 'Notion',
    description:
      'Ground agents in wikis, specs, and decision logs alongside quantitative sources.',
    category: 'files',
    logoDomain: 'notion.so',
    implementation: 'demo',
  },
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Deliver autonomous reports, alerts, and investigations directly into team conversations.',
    category: 'communication',
    logoDomain: 'slack.com',
    implementation: 'demo',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description:
      'Stream events from billing, auth, and internal services into monitored analyst queues.',
    category: 'developer',
    logoDomain: 'hookdeck.com',
    implementation: 'demo',
  },
  {
    id: 'rest',
    name: 'REST API',
    description:
      'Attach any HTTPS JSON source with scoped credentials, rate limits, and audit trails.',
    category: 'custom_apis',
    logoDomain: 'swagger.io',
    implementation: 'demo',
  },
  {
    id: 'graphql',
    name: 'GraphQL API',
    description:
      'Introspect schemas, batch fields, and cache stable analyst views over your graph.',
    category: 'custom_apis',
    logoDomain: 'graphql.org',
    implementation: 'demo',
  },
];
