import { ShoppingBag, MessageCircle, Sparkles, TrendingUp, Users } from 'lucide-react';

/**
 * Single source of truth for the app's top-level sections.
 * Consumed by the landing hub (HomePage) and cross-checked against
 * Navigation.jsx's sidebar groups. Add a new section here first.
 */
export const SECTIONS = [
  {
    key: 'billing-pos',
    label: 'Billing / POS',
    description: 'Catalog, inventory, invoices, customers, and store operations.',
    path: '/catalog',
    icon: ShoppingBag,
    color: '#8b6f47',
    routes: [
      '/catalog', '/inventory', '/invoices', '/store-locator', '/store-management',
      '/drive', '/product', '/cart', '/checkout', '/customers', '/walk-ins',
      '/custom-orders', '/custom-products', '/user-management', '/permissions',
      '/reports', '/onboarding',
    ],
  },
  {
    key: 'hr',
    label: 'HR',
    description: 'Staff dashboard, weekly schedules, and onboarding.',
    path: '/hr/dashboard',
    icon: Users,
    color: '#5d4e37',
    routes: ['/hr/dashboard', '/hr/weekly-schedule'],
  },
  {
    key: 'whatsapp-crm',
    label: 'WhatsApp CRM',
    description: 'WhatsApp messaging, abandoned checkout winback, segments, and campaigns.',
    path: '/whatsapp-crm',
    icon: MessageCircle,
    color: '#25D366',
    routes: [
      '/whatsapp-crm', '/shopify-winback', '/whatsapp-templates',
      '/crm-segments', '/crm-campaigns',
    ],
  },
  {
    key: 'agents',
    label: 'AI Agents',
    description: 'Product writer, reviewer, keywords, collections, and campaign creative.',
    path: '/agents/writer',
    icon: Sparkles,
    color: '#7c5cbf',
    routes: [
      '/agents/writer', '/agents/product-reviewer', '/agents/keywords',
      '/agents/naming-teams', '/agents/collections', '/agents/campaign-creative',
      '/agents/creative-pod', '/agents/marketing', '/agents/settings',
    ],
  },
  {
    key: 'seo',
    label: 'SEO',
    description: 'Site crawl, keyword planner, rank tracker, backlinks, and AI visibility.',
    path: '/seo/site-crawl',
    icon: TrendingUp,
    color: '#0288d1',
    routes: [
      '/seo/site-crawl', '/seo/keyword-planner', '/seo/rank-tracker',
      '/seo/backlinks', '/seo/local-seo', '/seo/ai-visibility', '/seo/serp-results',
    ],
  },
];
