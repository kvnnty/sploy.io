/**
 * Single source of truth for dashboard page headings and browser tab titles.
 * `/dashboard` layout uses `title.template: '%s · Sploy'` — `documentTitle` is the `%s` part.
 */
export const BRAND_NAME = 'Sploy';

export type DashboardRouteId =
  | 'new'
  | 'tasks'
  | 'notebooks'
  | 'library'
  | 'dataConnectors'
  | 'customAgents'
  | 'onboarding'
  | 'models'
  | 'ask'
  | 'settings'
  | 'settingsAccount'
  | 'settingsSecurity'
  | 'settingsTeam'
  | 'settingsNotifications'
  | 'settingsBilling';

export type DashboardRouteConfig = {
  /** Main heading (<h1>) */
  pageTitle: string;
  /** `document.title` segment (before ` · Sploy`); use "Section · Parent" when nested */
  documentTitle: string;
  description?: string;
  /** Only for /dashboard home hero */
  heroHeading?: string;
};

export const DASHBOARD_ROUTES: Record<DashboardRouteId, DashboardRouteConfig> = {
  new: {
    pageTitle: 'New',
    documentTitle: 'New',
    heroHeading: 'What do you want to analyze today?',
    description:
      'Ask anything about growth, revenue, retention, and channel performance. Sploy will select tools, run analysis, and return explainable outputs.',
  },
  tasks: {
    pageTitle: 'Tasks',
    documentTitle: 'Tasks',
    description: 'Schedule recurring notebook runs and always-on analyst checks.',
  },
  notebooks: {
    pageTitle: 'Notebooks',
    documentTitle: 'Notebooks',
    description: 'Build reusable analysis notebooks with SQL, Python, charts, and narrative blocks.',
  },
  library: {
    pageTitle: 'Library',
    documentTitle: 'Library',
    description: 'Store templates, saved analyses, and reusable prompt blocks.',
  },
  dataConnectors: {
    pageTitle: 'Connectors',
    documentTitle: 'Connectors',
    description:
      'Connectors let Sploy agents ingest, analyze, monitor, and automate business intelligence workflows across your stack.',
  },
  customAgents: {
    pageTitle: 'Custom agents',
    documentTitle: 'Custom agents',
    description: 'Create AI analysts with preset context, tools, and response styles.',
  },
  onboarding: {
    pageTitle: 'Onboarding',
    documentTitle: 'Onboarding',
    description: 'Guided setup to reach a production-ready analyst workspace.',
  },
  models: {
    pageTitle: 'Models',
    documentTitle: 'Models',
    description: 'Default model, code environment, and language for generated analyses.',
  },
  ask: {
    pageTitle: 'Ask',
    documentTitle: 'Ask',
    description: 'Real-time Q&A with executed queries, tool usage, and analyst notes.',
  },
  settings: {
    pageTitle: 'Settings',
    documentTitle: 'Settings',
  },
  settingsAccount: {
    pageTitle: 'Account',
    documentTitle: 'Account · Settings',
  },
  settingsSecurity: {
    pageTitle: 'Security',
    documentTitle: 'Security · Settings',
  },
  settingsTeam: {
    pageTitle: 'Team',
    documentTitle: 'Team · Settings',
  },
  settingsNotifications: {
    pageTitle: 'Notifications',
    documentTitle: 'Notifications · Settings',
  },
  settingsBilling: {
    pageTitle: 'Billing',
    documentTitle: 'Billing · Settings',
  },
};
