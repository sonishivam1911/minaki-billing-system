# Minaki billing frontend (Claude + Cursor)

Repo-wide standards. Cursor also loads `.cursor/rules/*.mdc`.

## Shopify / catalog data

Never pull a huge Shopify catalog in one request. Use cursor pagination (`first` + `after`). Agents tables show **10–30** rows per page (options 10, 15, 20, 25, 30).

## Agents UI

Use **Material UI**. On mobile, Agents nav and in-page tabs are **dropdowns**, not wrapping tab strips. See `.cursor/rules/agents-ui-material.mdc`.
