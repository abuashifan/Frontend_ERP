# Frontend ERP (Vue 3) — Project Context

Last updated: 2026-01-22

## Tracking Files (Source of Truth)

This frontend uses two tracking files:

1. `.copilot/frontend-context.md` → living project memory (this file)
2. `.copilot/frontend-plan.md` → master roadmap & tracking

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
- The ERP uses a two-level tab hierarchy:
  - Level 1: module tabs opened from the sidebar menu
  - Level 2: workspace tabs opened within the active module
- Each level-2 tab represents a dynamically created component instance.
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
- Multi-tenant header injection (`X-Company-Id`) is implemented via axios interceptor.
- Tenant selection UI is still pending; active company id is stored in Pinia + `localStorage`.

Initial company setup (single-company mode):

- App calls `GET /api/system/bootstrap` on shell mount
- If `setupRequired=true`, app redirects to `/setup/company`
- Setup creates the first company and binds `system.single_company_id` in backend settings
- Setup requires `fiscal_year_start_year` and will initialize periods/COA in backend for single-company deployments

Auth endpoint note (current state):

- Backend exposes `POST /api/auth/login` (email/password → Sanctum bearer token)
- Frontend login is Breeze-like (email/password) and stores bearer token locally

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

- Stack: Vue 3 + Vite + TS, Pinia, Vue Router (limited), Element Plus (components), Tailwind (styling).
- Virtual Tabs implemented as a two-level system:
  - Level 1 module tabs (sidebar)
  - Level 2 workspace tabs within a module
- KeepAlive is bounded and protected with an explicit LRU eviction strategy (never auto-evict dirty tabs).
- Auth is enabled by default (`VITE_AUTH_ENABLED=true` in `.env.example`) but can be disabled for dev via `VITE_AUTH_ENABLED=false`.
- `/setup/company` is treated as a public route so initial provisioning can be completed even when auth is enabled.
- Master data list workspaces are wired to backend APIs: Customers, Vendors, Products, Warehouses.
- Phase 7.4 in progress (transactional modules):
  - Sales Invoices list + create/edit form are wired to backend `/sales-invoices` and open as Virtual sub-tabs (auto-close form tab on save).
  - Customer Payments list + create/edit form are wired to backend `/customer-payments`.
  - Sales Returns list + create form are wired to backend `/sales-returns` (existing records open in view mode).
  - Purchase Orders list + create/edit form are wired to backend `/purchase-orders`.
  - Vendor Invoices list + create/edit form are wired to backend `/vendor-invoices`.
  - Vendor Payments list + create/edit form are wired to backend `/vendor-payments`.
  - Purchase Returns list + create form are wired to backend `/purchase-returns` (existing records open in view mode).
  - Inventory Movements list + create/edit form are wired to backend `/inventory-movements`.
  - Inventory Receivings list + create/edit form are wired to backend `/inventory-receivings`.
  - Warehouse Transfers list + create/edit form are wired to backend `/warehouse-transfers`.
  - Create-mode forms follow the KeepAlive-safe reset-on-close pattern: on true tab close, reset local form state so reopening “New” doesn’t show stale data.

  ## Sales Invoice — UI/UX Customizations (Template untuk form lain)

  Perubahan yang sudah diterapkan khusus di Sales Invoice form:

  - Layout header diubah jadi grid (lebih ringkas, tidak row-vertikal).
  - Field Due Date / Currency Code / Exchange Rate disembunyikan dari UI (tetap diisi default saat submit).
  - Panel ringkasan kanan-bawah: Sub Total → Discount → Tax → Total.
  - Nominal uang (Unit Price, Discount, Tax, Sub Total, Total) ditampilkan dengan pemisah ribuan; input kosong menampilkan placeholder (bukan 0.00 default).
  - UX input nominal uang memakai pola **format-on-blur** (saat fokus tampil raw) untuk menghindari bug kursor loncat ke belakang desimal.
  - Validasi wajib: Customer + Invoice Number.
  - Aturan enable/disable:
    - Product tidak bisa dipilih sebelum Customer & Invoice Number terisi.
    - Qty/Unit Price tidak bisa diisi sebelum Product dipilih.
  - Qty dibuat integer (tanpa desimal), menampilkan satuan (UOM) di samping input, dan saat blur ditampilkan dengan pemisah ribuan format Indonesia (contoh `1000` → `1.000`).
  - Kolom Description di UI dihilangkan; untuk sementara `lines.*.description` tetap dikirim dan diisi otomatis dari product name (backend masih mewajibkan).
  - Discount saat ini masih UI-only (belum dipersist), dicatat sebagai TODO.

Styling rule (maintenance):

- Use Tailwind utilities for styling.
- Avoid component-scoped CSS (`<style scoped>`) to keep styling consistent and easy to maintain.
