# Frontend ERP (Vue 3) — Master Project Plan

Last updated: 2026-01-21

## Rules (Non-Negotiable)

- This file is the master roadmap & tracking.
- Status vocabulary: NOT STARTED / IN PROGRESS / COMPLETED.
- Never skip phases or implement future phases prematurely.
- Read this file AND `.copilot/frontend-context.md` before suggesting or generating code.
- When a phase/step starts/completes, update both files incrementally.

---

## PHASE 0 — PROJECT FOUNDATION

[0.1] Separate frontend repository — COMPLETED (2026-01-21)

- Initialized git repository in `Frontend_ERP`
- Pushed `main` to remote `origin`

[0.2] Initialize Vue 3 project (SPA) — COMPLETED

- Vue 3 + Vite + TypeScript scaffolded

[0.3] Environment variables — COMPLETED (2026-01-21)

- `VITE_API_BASE_URL`
- `VITE_AUTH_ENABLED` (dev convenience)

[0.3A] Documentation & tracking baseline — COMPLETED

- Locked rules documented: `docs/virtual-tabs.md`

[0.3B] Decision log & change log — COMPLETED (2026-01-21)

- Added `docs/decisions.md` (ADRs) and `docs/changelog.md` (behavior/rules changes)
- Rule: any change to Virtual Tabs/auth/tenant rules must be logged

[0.4] Code quality tooling — COMPLETED (2026-01-21)

- ESLint (Vue + TypeScript) configured (flat config)
- Prettier configured (+ editor settings)
- Scripts added: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`

[0.5] Verify dev + build — COMPLETED

- `npm run build` passes

---

## PHASE 1 — CORE APPLICATION SHELL

[1.1] Main layout shell — COMPLETED

- Sidebar + Header + TabBar + TabContent host

[1.2] Desktop-first responsive baseline — IN PROGRESS

- Improve spacing, overflow, and min-height behavior

[1.3] Global styling baseline — COMPLETED

- Element Plus + Tailwind enabled

---

## PHASE 2 — SIDEBAR MENU SYSTEM

[2.1] Static menu configuration — COMPLETED

- Render menu from config
- Menu click opens/activates virtual tab
- Menu does not router-navigate

[2.2] Nested menus (optional) — NOT STARTED

---

## PHASE 3 — VIRTUAL TAB SYSTEM (TWO-LEVEL)

[3.1] Tab registry store in Pinia — COMPLETED (2026-01-21)

- Level 1: module tabs (`modules[]`, `activeModuleId`)
- Level 2: workspace tabs per module (`module.tabs[]`, `activeChildTabId`)
- Enforce unique IDs (module `id`, child `${moduleId}::${localId}`)

[3.2] Module tab UI (Level 1 bar) — COMPLETED

- List, active highlight, close button, overflow scroll
- Dirty indicator if any child tabs are dirty

[3.3] Workspace tab UI (Level 2 bar) — COMPLETED

- Child tab strip for active module
- Can be hidden per-module (`showSubTabsBar: false`)

[3.4] Tab content host — COMPLETED

- Dynamic component rendering from a component registry
- `<KeepAlive>` preserves instances
- Empty state and missing-registry state

[3.5] Rules hardening — COMPLETED

- Auto-select next tab on close (module and child)
- Prevent closing non-closable tabs
- Confirm close when dirty (child), confirm module close if any dirty children

[3.6] KeepAlive cache policy (bounded) — COMPLETED (2026-01-21)

- Max open child tabs cap + explicit LRU eviction (never auto-evict dirty tabs)
- Bound KeepAlive cache via `<KeepAlive :max>`

[3.7] Per-module UX flags — COMPLETED (2026-01-21)

- `showSubTabsBar` controls whether the Level-2 bar renders for that module

---

## PHASE 4 — FORM SAFETY & DIRTY STATE

[4.1] Per-tab dirty state — COMPLETED

- `dirty` flag stored in Pinia

[4.2] Close confirmation when dirty — COMPLETED

[4.3] Standardized dirty contract — COMPLETED

- Workspaces receive `tabId` and use the `useTabDirty(tabId)` helper

---

## PHASE 5 — ROUTER (LIMITED)

[5.1] Router setup — COMPLETED

- Router used only for high-level shell

[5.2] Auth routes & guards — COMPLETED (2026-01-21)

- Added `/login` and protected `/app`
- Router guards enforce authentication without controlling virtual tab lifecycle

[5.3] Optional URL sync (query only) — NOT STARTED

- Sync active tab ID to URL query (no creation driven by router)

---

## PHASE 6 — API LAYER & AUTH

[6.0] Choose auth approach (must decide before guards) — COMPLETED (2026-01-21)

- DECIDED: Laravel Sanctum token-based auth (Bearer token)
- Recorded in `docs/decisions.md` (ADR-0001)

[6.0A] Backend auth endpoint contract (login/token issuance) — NOT STARTED

- Current backend has no public `/login` or token-issuance endpoint exposed in routes.
- Frontend currently uses “paste token” login.
- If/when we want username/password login, define endpoint(s) + payload/response and implement in backend.

[6.1] Axios client — COMPLETED (2026-01-21)

- Base URL from `VITE_API_BASE_URL` with fallback

[6.2] Interceptors — COMPLETED (2026-01-21)

- Inject `Authorization: Bearer <token>` from Pinia auth store
- On HTTP 401: clear token and emit `auth:unauthorized` event


[6.3] Multi-tenant header support — COMPLETED (2026-01-21)

- `X-Company-Id` injection via axios request interceptor
- Tenant store persists active company id in `localStorage`


[6.4] Tenant context UI — IN PROGRESS (2026-01-21)

- Default mode: single-company (set once via `VITE_COMPANY_ID` and persisted)
- Optional company switcher UI can be enabled via `VITE_TENANT_SWITCHER_ENABLED=true`
- Switching company resets virtual tabs to avoid cross-tenant state leakage
- Next: replace manual input with company dropdown from backend endpoint (if/when added)

---

## PHASE 7 — CORE PAGES (DUMMY FIRST)

[7.0] Example workspaces (to prove Virtual Tabs rules) — COMPLETED

- Dashboard workspace
- Sales Invoice list workspace
- Sales Invoice form workspace (dummy)

[7.1] Master data dummy pages — NOT STARTED

- Customer/Vendor/Product list + forms (dummy)

[7.2] Accounting pages (dummy) — NOT STARTED

- COA, Journal list/form/detail (read-only)

---

## PHASE 8 — DASHBOARD

[8.1] Dashboard workspace — COMPLETED

---

## PHASE 9 — PERMISSIONS & ACCESS CONTROL

[9.1] Permission-driven menu visibility — NOT STARTED

- Match backend: permission-driven (not role-driven)
- Hide/disable actions based on granted permissions

---

## PHASE 10 — UX POLISH & PERFORMANCE

[10.1] Loading/toast/empty states — NOT STARTED

[10.2] Bundle size & code-splitting — NOT STARTED

- Reduce initial JS size (dynamic imports/manual chunks)
- Keep tab components lazy-loadable without breaking KeepAlive identity

---

## PHASE 11 — PRODUCTION READY

[11.1] Environment config (dev/prod) — NOT STARTED

[11.2] Stress testing (tabs/forms) — NOT STARTED
