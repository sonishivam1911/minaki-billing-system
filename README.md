# Minaki Billing System

React/Vite admin hub for MINAKI — despite the repo name this is **not just billing**. It's the
internal app for POS/billing, HR, WhatsApp CRM, AI content agents, "Fine by MINAKI" design intake,
SEO tooling, and infra spend tracking. `package.json`'s real name is `jewelry-pos-frontend`; that's
the historical core (POS) the rest grew around.

Live at **https://app.minaki.me**. Backend is [real-time-minaki-poc](https://github.com/sonishivam1911/real-time-minaki-poc)'s
FastAPI service at `https://api.minaki.me` — this repo is frontend only, no backend code here.

## Stack

React 18 + Vite 5 + Material UI, `react-router-dom`, Supabase JS client (auth/data), `recharts`
(charts), `xlsx`/`jspdf` (export). No TypeScript.

## Local development

Two ways to run it:

**Frontend only** (backend already running elsewhere, e.g. hitting prod API):
```bash
npm install
npm run dev          # http://localhost:3000
```

**Frontend + backend together** (needs `real-time-minaki-poc` cloned as a sibling directory —
`../real-time-minaki-poc/api`):
```bash
./start-dev.sh                # starts API on :8001 + frontend on :3000, opens a homelab Postgres
                               # SSH tunnel automatically (needs api/.env: HOMELAB_SSH_TARGET, SSH_KEY)
./start-dev.sh --no-tunnel    # skip the Postgres tunnel
```

`.env.local` is auto-created from `.env.example` on first run if missing.

## App structure — the sections registry

`src/config/sections.js` is the **single source of truth** for the app's top-level sections — it
feeds the `/` landing hub (`src/pages/HomePage.jsx`). As of this writing: Billing/POS, HR,
Marketing (WhatsApp CRM + winback + ads), AI Agents, Fine by MINAKI, SEO, Infra (admin-only).

**Adding a new top-level section:**
1. Add an entry to `SECTIONS` in `src/config/sections.js` first — that's the intended single edit
   point (see the file's own header comment).
2. Also manually add a matching entry to `Navigation.jsx`'s sidebar groups — it was **not**
   refactored to read from the registry (deemed too risky in the PR that introduced the registry,
   [#62](https://github.com/sonishivam1911/minaki-billing-system/pull/62)), so the two can drift if
   you only touch one.

See the `hub-sections-registry` skill (`.claude/skills/`) for the full pattern and gotchas.

## UI conventions (enforced via `.cursor/rules/*.mdc`, summarized in `AGENTS.md`)

- **Shopify pagination**: any Shopify Admin catalog read must use cursor pagination (`first`/
  `after`), never fetch the full catalog in one request. Lists cap at 30 rows/page.
- **Agents UI**: Material UI only; mobile (≤767px) nav/tabs are dropdowns, not tab strips.
- **Billing UI builder**: every *new* screen is a `BillingScreen` class using `BillingUiBuilder`
  widgets (`src/ui/`) — not a one-off table/filter. Existing pages migrate slowly, this only
  applies going forward.

## Deploy

Auto-deploys via `.github/workflows/deploy-contabo.yml` on push to `main`, on a self-hosted GitHub
Actions runner on the Contabo VPS — same mechanism as `real-time-minaki-poc` and `minaki-deployment`
itself. **Never deploy manually and never merge without a PR** — push a branch, open a PR, let it
merge, the workflow handles the rest. See [minaki-deployment](https://github.com/sonishivam1911/minaki-deployment)'s
README for the full CI/CD picture across all three repos.

Build-time env (`VITE_*`) is baked in at `npm run build` — see `minaki-deployment`'s README
("Minaki Billing frontend" section) for how `VITE_SUPABASE_ANON_KEY` gets force-aligned to the live
Kong anon key during deploy so a stale value can't break login.

## Related repos

| Repo | Role |
|---|---|
| [real-time-minaki-poc](https://github.com/sonishivam1911/real-time-minaki-poc) | Backend API this app calls, and MINAKI's MCP tool server |
| [minaki-deployment](https://github.com/sonishivam1911/minaki-deployment) | Deploys this app (and the rest of the stack) to Contabo |
