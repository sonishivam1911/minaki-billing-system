# Minaki Billing System — agent context

Internal MINAKI admin hub (React/Vite). Full picture in `README.md` — read that first for stack,
local dev, and deploy. This file is repo-wide rules only. `.cursor/rules/*.mdc` has the same rules
in Cursor's own format; keep both in sync if you change one.

## Must

- **Shopify pagination**: cursor pagination (`first`/`after`) always, never a full catalog fetch in
  one request. Lists: 10/15/20/25/30 rows per page, never more.
- **Agents UI** (`src/pages/agents/`, `src/components/agents/`): Material UI only. Mobile (≤767px)
  nav/tabs are `Select` dropdowns, not wrapping tab strips.
- **Billing UI builder**: every *new* screen is a `BillingScreen` class composed from
  `BillingUiBuilder` widgets (`src/ui/`) — don't hand-roll a table/filter. Existing pages migrate
  slowly; this is forward-only, don't rewrite old pages to comply.
- **New top-level app section**: add to `src/config/sections.js` first, then manually mirror into
  `Navigation.jsx` (not registry-driven yet — see the `hub-sections-registry` skill).
- **Deploy**: never manually, never without a PR. Push → PR → merge → `deploy-contabo.yml`
  auto-deploys on a self-hosted runner. See `README.md`'s Deploy section.

## Skills

- `hub-sections-registry` — adding/restructuring top-level app sections.

## Where things live

```
src/config/sections.js   top-level section registry (single source of truth for the landing hub)
src/pages/HomePage.jsx   landing hub, reads sections.js
src/ui/                  BillingUiBuilder + shared widgets
src/pages/agents/        AI Agents section (Material UI required)
start-dev.sh             frontend + backend (real-time-minaki-poc/api) local dev, with Postgres tunnel
```
