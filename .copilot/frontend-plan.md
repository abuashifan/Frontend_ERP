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

[0.3] Environment variables — IN PROGRESS

- `VITE_API_BASE_URL`

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

[2.1] Static menu configuration — IN PROGRESS

- Render menu from config
- Menu click opens/activates virtual tab
- Menu does not router-navigate

[2.2] Nested menus (optional) — NOT STARTED

---

## PHASE 3 — VIRTUAL TAB SYSTEM (CORE)

[3.1] Tab registry store in Pinia — COMPLETED

- `tabs[]`, `activeTabId`
- `openTab`, `closeTab`, `activateTab`
- Enforce unique tab ID

[3.2] Tab UI — COMPLETED

- Tab bar list, active highlight, close button, overflow scroll

[3.3] Tab content host — COMPLETED

- Dynamic component rendering
- `<KeepAlive>` preserves instances
- Empty state

[3.4] Tab rules hardening — IN PROGRESS

- Auto-select next tab on close
- Prevent closing non-closable tabs

[3.5] KeepAlive cache policy — NOT STARTED

- Prevent unbounded memory usage
- Define max open tabs and/or eviction strategy
- Define how to handle "reopen" after eviction (fresh state vs restore)

[3.5] KeepAlive cache policy — COMPLETED (2026-01-21)

- Implemented max open tab cap + explicit LRU eviction (never auto-evict dirty tabs)
- Bound KeepAlive cache via `<KeepAlive :max>`

---

## PHASE 4 — FORM SAFETY & DIRTY STATE

[4.1] Per-tab dirty state — COMPLETED

- `dirty` flag stored in Pinia

[4.2] Close confirmation when dirty — COMPLETED

[4.3] Standardized dirty contract — IN PROGRESS

- Establish a consistent pattern for workspaces/forms to report dirty/saved

---

## PHASE 5 — ROUTER (LIMITED)

[5.1] Router setup — COMPLETED

- Router used only for high-level shell

[5.2] Auth routes & guards — NOT STARTED

- `/login`, `/app`
- Guards must not control tab lifecycle

[5.3] Optional URL sync (query only) — NOT STARTED

- Sync active tab ID to URL query (no creation driven by router)

---

## PHASE 6 — API LAYER & AUTH

[6.0] Choose auth approach (must decide before guards) — COMPLETED (2026-01-21)

- DECIDED: Laravel Sanctum token-based auth (Bearer token)
- Recorded in `docs/decisions.md` (ADR-0001)

[6.1] Axios client — COMPLETED (2026-01-21)

- Base URL from `VITE_API_BASE_URL` with fallback

[6.2] Interceptors — COMPLETED (2026-01-21)

- Inject `Authorization: Bearer <token>` from Pinia auth store
- On HTTP 401: clear token and emit `auth:unauthorized` event

[6.3] Multi-tenant header support — NOT STARTED

- `X-Company-Id` injection

[6.4] Tenant context UI — NOT STARTED

- Define how user selects active company
- Persist active company (store + localStorage)
- Ensure all API calls include the active tenant header

---

## PHASE 7 — CORE PAGES (DUMMY FIRST)

[7.1] Master data dummy pages — NOT STARTED

- Customer/Vendor/Product list + forms (dummy)

[7.2] Accounting pages (dummy) — NOT STARTED

- COA, Journal list/form/detail (read-only)

---

## PHASE 8 — DASHBOARD

[8.1] Dashboard workspace — NOT STARTED

---

## PHASE 9 — PERMISSIONS & ACCESS CONTROL

[9.1] Permission-driven menu visibility — NOT STARTED

- Match backend: permission-driven (not role-driven)
- Hide/disable actions based on granted permissions

---

## PHASE 10 — UX POLISH & PERFORMANCE

[10.1] Loading/toast/empty states — NOT STARTED

[10.2] KeepAlive memory strategy — NOT STARTED

- Avoid unbounded cache growth

---

## PHASE 11 — PRODUCTION READY

[11.1] Environment config (dev/prod) — NOT STARTED

[11.2] Stress testing (tabs/forms) — NOT STARTED
