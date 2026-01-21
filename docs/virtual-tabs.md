# Virtual Tabs — Concept & Rules (Frontend ERP)

## What “Virtual Tabs” are
Virtual Tabs are internal application workspaces. Each tab is a preserved component instance, not a browser tab and not a router tab.

## What Virtual Tabs are NOT
- Not browser tabs
- Not purely UI tabs from a component library
- Not route-based tabs

## Source of truth
- The tab registry lives in Pinia and is the single source of truth.
- The router must never be the primary driver of opening/closing tabs.

## Lifecycle & state
- Switching tabs must not unmount components.
- Component instances are preserved using `<KeepAlive>`.
- Multiple instances of the same workspace component are allowed as long as their tab IDs differ.

## IDs & duplication
- Every tab has a unique `id`.
- Opening a tab with an existing `id` must activate the existing tab, not create a duplicate.

## Closing rules & dirty state
- Each tab can be marked `dirty` when it has unsaved data.
- When closing a dirty tab, show a confirmation dialog.
- After successful save, dirty state must be cleared.

## KeepAlive memory strategy (bounded)
To prevent memory growth when many tabs are opened:
- We enforce a max open tab cap.
- We also set `<KeepAlive :max>` to bound the component instance cache.

### Explicit eviction rules
When opening a new tab while at the max cap:
- The system may auto-close (explicitly remove from Pinia registry) an **inactive, closable, non-dirty** tab.
- Selection uses LRU (least recently accessed).
- Dirty tabs are never auto-evicted; user must close manually.

## Router boundaries
Router is allowed only for:
- Initial landing
- High-level navigation (e.g. `/login`, `/app`)

Router must not control:
- Tab creation
- Tab lifecycle
- Tab state

## Workspace component contract (recommended)
Each workspace component should:
- Accept `tabId` prop
- Report dirty/saved via Pinia store helpers
- Avoid relying on route params for its identity
