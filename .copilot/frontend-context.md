# Frontend ERP (Vue 3) — Project Context

Last updated: 2026-01-21

## Tracking Files (Source of Truth)
This frontend uses two tracking files:
1) `.copilot/frontend-context.md` → living project memory (this file)
2) `.copilot/frontend-plan.md` → master roadmap & tracking

Rules:
- Read both files before suggesting or generating code.
- Status vocabulary: NOT STARTED / IN PROGRESS / COMPLETED.
- Never skip phases or implement future phases prematurely.
- When a phase/step starts or completes, update both files incrementally.

## Purpose
Build an ERP-style SPA frontend that consumes the Laravel backend as a headless API.

Primary priority: correctness of user workflows and state safety (tab persistence, dirty-state protection).

## Non-Negotiable UI Concept — Virtual Tabs (LOCKED)
Clarification:
- Virtual Tabs are NOT browser tabs.
- Virtual Tabs are NOT UI-only tabs from a component library.
- Virtual Tabs are NOT route-based tabs.

Definition:
- Virtual Tabs are internal application workspaces.
- Each tab represents a dynamically created component instance.
- Multiple instances of the same component with different parameters are allowed.

State & lifecycle rules:
- Tab registry is the SINGLE SOURCE OF TRUTH and is stored ONLY in Pinia.
- Vue Router MUST NOT be used as the primary driver of tab creation.
- Changing active tabs MUST NOT unmount components.
- Component instances MUST be preserved using `<KeepAlive>`.

Router usage (limited):
- Router may be used only for:
  - Initial landing page
  - High-level navigation (e.g. /login, /app)
- Router MUST NOT control:
  - Tab lifecycle
  - Tab instances
  - Tab state

Tab behavior:
- Opening a menu item creates or activates a virtual tab.
- Closing a tab removes it from the Pinia registry.
- Tabs are identified by unique IDs (e.g. `sales-invoice-123`).
- Duplicate tabs with the same ID must NOT be created.
- Each tab manages its own local component state.

Form safety:
- Form data must persist when switching tabs.
- If a tab contains unsaved data (dirty state), show a confirmation before closing.

## Backend Integration Constraints
- Backend is Laravel API (headless).
- Frontend should be prepared for multi-tenant header usage (`X-Company-Id`) on API calls.

## Decisions (Must Be Explicit)
These decisions affect architecture and must be recorded before implementing dependent features:
- Auth strategy (DECIDED): Laravel Sanctum token-based auth (Bearer token).
- Tenant context strategy (TBD): how `X-Company-Id` is selected, stored, and injected on requests.

When a decision changes, record it in `docs/decisions.md` and add an entry to `docs/changelog.md`.

## Documentation Rules
- Locked rules live in documentation and must be treated as contract.
  - Virtual Tabs contract: `docs/virtual-tabs.md`
- Track record:
  - Architectural decisions: `docs/decisions.md`
  - Change log for rule/behavior changes: `docs/changelog.md`

## UI Authorization Philosophy (Frontend)
- UI behavior is permission-driven to match backend enforcement.
- Menu visibility and action enabling must be based on permissions (not roles).
- Backend remains the source of truth; frontend checks are UX optimization only.

## Implementation Notes (Current)
- Stack: Vue 3 + Vite + TS, Pinia, Vue Router (limited), Element Plus, Tailwind.
- Virtual tab skeleton implemented (Tab store + KeepAlive host + close confirm).
