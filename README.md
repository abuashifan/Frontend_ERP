# Frontend ERP (Vue 3 + TypeScript)

Frontend for the Accounting/ERP backend.

## Dev

- Install: `npm install`
- Run: `npm run dev`
- Typecheck: `npm run typecheck`

## Tenant / Company setup

Backend enforces tenant context using `X-Company-Id`.

- If no company exists yet, the app redirects to `/setup/company`.
- After setup, use **Company Settings** to:
	- Sync company context (tenant store)
	- Ensure accounting periods exist (dev/self-heal)

## GL History (Journals)

Menu **Journals** provides a GL History view backed by `GET /api/journals`.

- Filter by `source_type` + `source_id` to see journals created by a transaction.
- For Sales Invoice, the posted journal is `ar.sales_invoice` and it includes COGS lines (Dr COGS / Cr Inventory) when applicable.

Tip:

- To trace a Sales Invoice: set `source_type=ar.sales_invoice` and `source_id=(invoice id)`.
