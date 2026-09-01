/**
 * Quick-access links for the Infra landing page.
 * `href` points at the tool's generic dashboard/login URL where a
 * project-specific deep link isn't knowable from code (Supabase, Infisical,
 * Contabo, etc. are account-specific) — swap in the exact project/org URL
 * here once you have it, no other change needed.
 */
export const INFRA_LINKS = [
  {
    key: 'supabase',
    label: 'Supabase',
    description: 'Postgres database, auth, storage.',
    href: 'https://supabase.com/dashboard/projects',
  },
  {
    key: 'infisical',
    label: 'Infisical',
    description: 'Secrets manager — POSTGRES_URI, API keys, etc.',
    href: 'https://app.infisical.com',
  },
  {
    key: 'contabo',
    label: 'Contabo VPS',
    description: 'Hosts minaki_api / minaki_api_worker containers.',
    href: 'https://my.contabo.com',
  },
  {
    key: 'openrouter',
    label: 'OpenRouter',
    description: 'LLM billing/usage dashboard — account-wide spend, API keys.',
    href: 'https://openrouter.ai/activity',
  },
  {
    key: 'langsmith',
    label: 'LangSmith',
    description: 'LLM call traces for agent runs (@traceable).',
    href: 'https://smith.langchain.com',
  },
  {
    key: 'github-backend',
    label: 'GitHub — real-time-minaki-poc',
    description: 'Backend API repo.',
    href: 'https://github.com/sonishivam1911/real-time-minaki-poc',
  },
  {
    key: 'github-frontend',
    label: 'GitHub — minaki-billing-system',
    description: 'This app.',
    href: 'https://github.com/sonishivam1911/minaki-billing-system',
  },
  {
    key: 'github-deployment',
    label: 'GitHub — minaki-deployment',
    description: 'Deploy configs / Docker images.',
    href: 'https://github.com/sonishivam1911/minaki-deployment',
  },
];
