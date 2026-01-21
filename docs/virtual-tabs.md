# Virtual Tabs — Concept & Rules (Frontend ERP)

## What “Virtual Tabs” are

Virtual Tabs are internal application workspaces.

This ERP uses a **two-level tab hierarchy**:

- **Level 1 (Module Tabs):** tabs opened from the sidebar menu (e.g., Dashboard, Sales Invoice, Journal, Reports).
- **Level 2 (Workspace Tabs):** tabs opened within an active module (e.g., multiple Sales Invoice forms under the Sales Invoice module).

Each Level-2 tab is a preserved component instance, not a browser tab and not a router tab.

## What Virtual Tabs are NOT

- Not browser tabs
- Not purely UI tabs from a component library
- Not route-based tabs

## Source of truth

- The module/workspace tab registry lives in Pinia and is the single source of truth.
- The router must never be the primary driver of opening/closing tabs.

## Lifecycle & state

- Switching module tabs or workspace tabs must not unmount components.
- Component instances are preserved using `<KeepAlive>`.
- Multiple instances of the same workspace component are allowed as long as their Level-2 tab IDs differ.

## IDs & duplication

- Every module tab (Level 1) has a unique `id`.
- Every workspace tab (Level 2) has a unique `id`.
- Opening an existing `id` must activate the existing tab, not create a duplicate.

## Closing rules & dirty state

- Each workspace tab (Level 2) can be marked `dirty` when it has unsaved data.
- When closing a dirty workspace tab, show a confirmation dialog.
- When closing a module tab, warn/confirm if it contains any dirty workspace tabs.
- After successful save, dirty state must be cleared.

## KeepAlive memory strategy (bounded)

To prevent memory growth when many workspace tabs are opened:

- We enforce a max open tab cap.
- We also set `<KeepAlive :max>` to bound the component instance cache.

### Explicit eviction rules

When opening a new workspace tab while at the max cap:

- The system may auto-close (explicitly remove from Pinia registry) an **inactive, closable, non-dirty** tab.
- Selection uses LRU (least recently accessed).
- Dirty tabs are never auto-evicted; user must close manually.

## Router boundaries

Router is allowed only for:

- Initial landing
- High-level navigation (e.g. `/login`, `/app`)

Router must not control:

- Module/workspace tab creation
- Module/workspace tab lifecycle
- Module/workspace tab state

## Workspace component contract (recommended)

Each workspace component should:

- Accept `tabId` prop
- Report dirty/saved via Pinia store helpers
- Avoid relying on route params for its identity
