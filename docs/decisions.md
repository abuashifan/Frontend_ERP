# Decisions (ADR) — Frontend ERP

Last updated: 2026-01-21

This document records decisions that affect architecture and constraints.

## ADR-0001 — Authentication strategy (TBD)

Status: DECIDED (2026-01-21)

Options:

- A) Laravel Sanctum cookie-based SPA (session/cookie + CSRF)
- B) Token-based auth (Bearer token)

Decision:

- Use Laravel Sanctum token-based authentication.
- Frontend sends `Authorization: Bearer <token>` on API requests.

Consequences:

- Axios interceptors must inject the Bearer token.
- Token persistence strategy: Pinia store backed by `localStorage`.
- Logout must revoke token (if backend supports) and clear local token.
- No CSRF cookie flow required for API requests (unlike Sanctum SPA cookie mode).

Implementation notes:
- Token is loaded on app boot.
- On HTTP 401, token is cleared and a global `auth:unauthorized` event is emitted.

---

## ADR-0002 — Tenant context strategy (TBD)

Status: DECIDED (2026-01-21)

Context:

- Backend enforces tenant via `X-Company-Id`.

Decision:

- Default mode is **single-company per app deployment**.
- `X-Company-Id` is injected on every request from a persisted tenant store.
- `company_id` can be configured once via env (`VITE_COMPANY_ID`) and stored locally.
- A company-switcher UI is optional and disabled by default; it may be enabled later for a branch system.

Consequences:

- Frontend must reset tab state when switching company to avoid cross-tenant state leakage.
- Most users will never change tenant; switching is an admin/dev-only capability for now.
