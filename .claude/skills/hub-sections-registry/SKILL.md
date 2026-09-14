---
name: hub-sections-registry
description: Add, rename, or restructure a top-level section of the Minaki Billing System landing hub. Trigger — "add a new section to the hub", "add a top-level nav item", "restructure the app sections", "why isn't my new page in the sidebar", "sections.js".
---

# Hub sections registry

`src/config/sections.js` is the single source of truth for the app's top-level sections — it feeds
the `/` landing hub (`src/pages/HomePage.jsx`). Current sections (2026-09-08): Billing/POS, HR,
Marketing, AI Agents, Fine by MINAKI, SEO, Infra. Established in
[PR #62](https://github.com/sonishivam1911/minaki-billing-system/pull/62).

## Adding a new section

1. Add an entry to the `SECTIONS` array in `src/config/sections.js`:
   ```js
   {
     key: 'my-section',
     label: 'My Section',
     description: 'One line shown on the hub tile.',
     path: '/my-section/default-page',   // where the tile links
     icon: SomeLucideIcon,                // import from 'lucide-react'
     color: '#hexcolor',
     routes: ['/my-section/a', '/my-section/b'],  // every route this section owns
     adminOnly: true,   // optional — omit unless the section should be hidden from non-admins
   }
   ```
2. **Also manually add a matching entry to `Navigation.jsx`'s sidebar groups.** This is the trap:
   `Navigation.jsx` was deliberately **not** refactored to read from `sections.js` when the registry
   was introduced (judged too large/risky a change for that PR) — the two are two separate places
   that both need updating, or the sidebar and the hub tile silently disagree about what routes
   exist.
3. If the section should only be visible to admins/managers, use `adminOnly: true` on the section
   (see the existing `infra` entry) — there's no separate cashier/staff role concept in this
   codebase, only `isAdmin()`/`isManager()` gating specific pages. The root `/` hub itself is shown
   to *all* users regardless of role; only individual sections/pages gate further.

## Why it's split this way

User confirmed (2026-08-31) the landing hub should show to all users with no role-based landing
split, and confirmed a fine-grained section split (HR broken out separately, etc.) over a coarser
4-section alternative. The Navigation.jsx registry-sync gap was an explicit, acknowledged tradeoff
in PR #62 — not an oversight to "fix" without checking first; a full Navigation.jsx refactor to
consume the registry is still an open follow-up, not yet scheduled.
