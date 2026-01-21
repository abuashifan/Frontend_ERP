# Change Log — Frontend ERP

All notable changes to frontend rules/behavior are documented here.

## 2026-01-21

- Initialized tracking docs: Virtual Tabs rules, plan, and context.
- Added Tailwind + Element Plus baseline.
- Implemented Virtual Tabs skeleton (Pinia registry + KeepAlive + dirty-close confirm).
- DECIDED auth strategy: Laravel Sanctum token-based (Bearer token).
- Implemented API/auth foundation: Pinia auth store + axios client + Bearer interceptor + 401 unauthorized event.
- Added `/login` route + auth guard for `/app` and wired unauthorized redirect.
- Added `VITE_AUTH_ENABLED` flag to disable auth enforcement during development.
- Refactored Virtual Tabs into two levels: module tabs (menu) + workspace sub-tabs per module.
- Hide sub-tab bar for modules that don't need child tabs (e.g., Dashboard).
- Implement multi-tenant header injection (`X-Company-Id`) via axios + tenant store (no UI yet).
- Add initial tenant context UI (manual Company ID input) and reset tabs when switching.
- Default to single-company mode via `VITE_COMPANY_ID`; company switcher UI is optional (`VITE_TENANT_SWITCHER_ENABLED`).
