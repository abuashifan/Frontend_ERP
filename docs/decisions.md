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
- Token persistence strategy must be defined (store + storage).
- Logout must revoke token (if backend supports) and clear local token.
- No CSRF cookie flow required for API requests (unlike Sanctum SPA cookie mode).

---

## ADR-0002 — Tenant context strategy (TBD)
Status: TBD

Context:
- Backend enforces tenant via `X-Company-Id`.

Decision:
- TBD

Consequences:
- Determines how we store active company and inject tenant headers.
